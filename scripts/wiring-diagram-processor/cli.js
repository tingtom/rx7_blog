#!/usr/bin/env node

require("dotenv").config({ path: ['.env.local', '.env'] });
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const VisionClient = require('./visionClient');
const config = require('./config');

// Translation prompt specifically for translating Japanese to English
const TRANSLATION_PROMPT = `You are an image translation specialist for Japanese automotive wiring diagrams.

TASK: Generate a new image that is identical to the input but with ALL Japanese text translated to English.

CRITICAL INSTRUCTIONS:
- Output ONLY the translated image
- Do NOT include any text response or JSON
- Translate every Japanese character to English
- Keep wire colors, line styles, symbols, layouts, and all graphics exactly the same
- Only change text labels (component names, connector names, pin labels, etc.)
- Use standard automotive English terminology`;

class WiringDiagramProcessor {
  constructor() {
    this.analysisClient = new VisionClient(config.analysis);
    if (config.translation?.enabled) {
      this.translationClient = new VisionClient(config.translation, TRANSLATION_PROMPT);
      console.log(`✓ Translation enabled: ${config.translation.provider}/${config.translation.model}`);
    } else {
      this.translationClient = null;
    }
    this.stats = { processed: 0, skipped: 0, errors: 0 };
  }

  async processDirectory(inputDir, outputDir) {
    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });
    
    // For JSONL output: collect all results
    const allResults = [];
    const jsonlPath = path.join(outputDir, 'all-diagrams.jsonl');
    // Clear existing JSONL file
    if (fs.existsSync(jsonlPath)) fs.unlinkSync(jsonlPath);
    
    // Get all image files
    const files = fs.readdirSync(inputDir)
      .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));
    
    if (files.length === 0) {
      console.log(`No images found in ${inputDir}`);
      return;
    }
    
    console.log(`Found ${files.length} images to process.`);
    console.log(`Analysis model: ${config.analysis.provider}/${config.analysis.model}`);
    if (this.translationClient) {
      console.log(`Translation model: ${config.translation.provider}/${config.translation.model}`);
    } else {
      console.log('Translation: disabled (single-pass)');
    }
    console.log('');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
      
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace(/\.[^.]+$/, '.json'));
      
      // Skip if already processed
      if (fs.existsSync(outputPath)) {
        console.log('  Already exists, skipping.');
        this.stats.skipped++;
        // Still read existing file to add to JSONL
        try {
          const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
          allResults.push(existing);
          fs.appendFileSync(jsonlPath, JSON.stringify(existing) + '\n');
        } catch (e) {
          // ignore
        }
        continue;
      }
      
      try {
        const result = await this.processImage(inputPath, outputPath);
        if (result) {
          allResults.push(result);
          // Append to JSONL (minified, one line)
          fs.appendFileSync(jsonlPath, JSON.stringify(result) + '\n');
        }
        this.stats.processed++;
      } catch (error) {
        // Error already logged by processImage
        this.stats.errors++;
      }
    }
    
    console.log(`✓ JSONL written to: ${jsonlPath}`);
  }
  
  async processImage(imagePath, outputPath) {
    try {
      console.log('  Step 1/2: Analyzing image...');
      const analysisData = await this.analysisClient.analyzeImage(imagePath);
      
      // Log analysis results
      console.log('  Analysis complete:');
      console.log(`    Title: "${analysisData.title}"`);
      console.log(`    Category: ${analysisData.category || 'not specified'}`);
      console.log(`    Wire Colors: ${analysisData.wireColors?.length || 0} (${analysisData.wireColors?.join(', ') || 'none'})`);
      console.log(`    Components: ${analysisData.components?.length || 0} (${analysisData.components?.join(', ') || 'none'})`);
      console.log(`    Connectors: ${analysisData.connectors?.length || 0} (${analysisData.connectors?.join(', ') || 'none'})`);
      console.log(`    ECU Pins: ${analysisData.ecuPins?.length || 0} (${analysisData.ecuPins?.join(', ') || 'none'})`);
      console.log(`    Year Range: ${analysisData.yearRange || 'not specified'}`);
      if (analysisData.description) {
        const descPreview = analysisData.description.substring(0, 100);
        console.log(`    Description: "${descPreview}${analysisData.description.length > 100 ? '...' : ''}"`);
      }
      console.log(`    Confidence: ${analysisData.confidence !== undefined ? `${(analysisData.confidence * 100).toFixed(1)}%` : 'not provided'}`);
      
       let data = analysisData;
       let generatedImageBase64 = null;
       if (this.translationClient) {
         console.log('  Step 2/2: Translating with second model...');
         try {
           const translatedData = await this.translationClient.analyzeImage(imagePath);
           
           // Check if a translated image was generated
           if (translatedData._generatedImage) {
             generatedImageBase64 = translatedData._generatedImage;
             delete translatedData._generatedImage; // Don't include in JSON output
             console.log('  ✓ Translated image generated');
           }
           
           // Merge text fields if any (image-only translation won't have these)
           if (Object.keys(translatedData).length > 0) {
             data = this.mergeResults(analysisData, translatedData);
             
             console.log('  Translation complete:');
             console.log(`    Translated Title: "${data.title}"`);
             console.log(`    Translated Components: ${data.components?.length || 0} (${data.components?.join(', ') || 'none'})`);
             console.log(`    Translated Connectors: ${data.connectors?.length || 0} (${data.connectors?.join(', ') || 'none'})`);
             console.log(`    Translated ECU Pins: ${data.ecuPins?.length || 0} (${data.ecuPins?.join(', ') || 'none'})`);
             if (data.description) {
               const descPreview = data.description.substring(0, 100);
               console.log(`    Translated Description: "${descPreview}${data.description.length > 100 ? '...' : ''}"`);
             }
           } else {
             console.log('  Translation image-only (no text fields merged)');
           }
         } catch (translationErr) {
           // Translation failed - continue with analysis data only
           console.warn(`  ⚠ Translation failed: ${translationErr.message}`);
           console.warn('  Continuing with analysis results only (no translation).');
           data = analysisData;
         }
       }

      // Deduplicate arrays if configured
      if (config.deduplicateArrays) {
        const fields = ['wireColors', 'components', 'connectors', 'ecuPins'];
        let dedupOccurred = false;
        fields.forEach((field) => {
          if (Array.isArray(data[field])) {
            const before = data[field].length;
            data[field] = [...new Set(data[field].map(String).map((s) => s.trim()))].filter(Boolean);
            const after = data[field].length;
            if (before !== after) {
              dedupOccurred = true;
              console.log(`    Deduplicated ${field}: ${before} -> ${after}`);
            }
          }
        });
        if (!dedupOccurred) {
          console.log('    No duplicates found in arrays.');
        }
      }
      
       // Add metadata
       const result = {
         ...data,
         imageFilename: path.basename(imagePath),
         processedAt: new Date().toISOString(),
         _type: 'wiringDiagram',
       };
       
       // Save generated image if present
       if (generatedImageBase64) {
         const imageExt = 'png'; // Gemini outputs PNG
         const imageFilename = path.basename(outputPath, '.json') + '.' + imageExt;
         const imageOutputPath = path.join(outputDir, imageFilename);
         
         // Remove data URL prefix (e.g., "data:image/png;base64,")
         const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, '');
         fs.writeFileSync(imageOutputPath, base64Data, { encoding: 'base64' });
         
         result.translatedImageFilename = imageFilename;
         console.log(`  ✓ Saved translated image: ${imageOutputPath}`);
       }
       
       // Review if confidence is low
       const needsReview = (result.confidence || 0) < config.confidenceThreshold;
       
       if (needsReview) {
         console.log(`  ⚠ Low confidence (${(result.confidence * 100).toFixed(1)}%) - review required`);
         const edited = await this.reviewResult(result);
         if (edited === null) {
           console.log('  ✗ Skipped by user.\n');
           return null;
         }
         Object.assign(result, edited);
         console.log('  After editing:');
         console.log(`    Title: "${result.title}"`);
         console.log(`    Wire Colors: ${result.wireColors?.length || 0} (${result.wireColors?.join(', ') || 'none'})`);
         console.log(`    Components: ${result.components?.length || 0}`);
         console.log(`    Connectors: ${result.connectors?.length || 0}`);
         console.log(`    ECU Pins: ${result.ecuPins?.length || 0}`);
       }
       
       // Save JSON (minified)
       const jsonBytes = JSON.stringify(result);
       fs.writeFileSync(outputPath, jsonBytes);
       console.log(`  ✓ Saved: ${outputPath} (${jsonBytes.length} bytes, minified)\n`);
       
       return result;
      
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
      throw error;
    }
  }
  
  mergeResults(analysis, translation) {
    // Fields to override from translation (text fields)
    const textFields = ['title', 'description', 'notes', 'components', 'connectors', 'ecuPins'];
    const merged = { ...analysis };
    
    for (const field of textFields) {
      if (translation[field] !== undefined) {
        merged[field] = translation[field];
      }
    }
    
    // Keep analysis category/yearRange as they are more accurate for categorization
    return merged;
  }
  
  async reviewResult(data) {
    console.log('\n----- Review Required -----');
    console.log(`Image: ${data.imageFilename}`);
    console.log(`Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`Title: ${data.title}`);
    console.log(`Category: ${data.category || 'none'}`);
    console.log(`Wire Colors: ${data.wireColors?.join(', ') || 'none'}`);
    console.log(`Components: ${data.components?.join(', ') || 'none'}`);
    console.log(`Connectors: ${data.connectors?.join(', ') || 'none'}`);
    console.log(`ECU Pins: ${data.ecuPins?.join(', ') || 'none'}`);
    console.log(`Year Range: ${data.yearRange || 'none'}`);
    console.log('---------------------------\n');
    
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Accept as is', value: 'accept' },
        { name: 'Edit fields', value: 'edit' },
        { name: 'Skip (do not save)', value: 'skip' }
      ]
    }]);
    
    if (action === 'skip') return null;
    if (action === 'accept') return {};
    
    // Edit mode - prompt for each field
    const fields = [
      { key: 'title', type: 'input', message: 'Title:' },
      { key: 'description', type: 'input', message: 'Description:' },
      { key: 'category', type: 'input', message: 'Category:' },
      { key: 'yearRange', type: 'input', message: 'Year Range:' },
      { key: 'notes', type: 'input', message: 'Notes:' },
      { 
        key: 'wireColors', 
        type: 'input', 
        message: 'Wire Colors (comma-separated):',
        transform: (val) => val.split(',').map(s => s.trim()).filter(Boolean)
      },
      { 
        key: 'components', 
        type: 'input', 
        message: 'Components (comma-separated):',
        transform: (val) => val.split(',').map(s => s.trim()).filter(Boolean)
      },
      { 
        key: 'connectors', 
        type: 'input', 
        message: 'Connectors (comma-separated):',
        transform: (val) => val.split(',').map(s => s.trim()).filter(Boolean)
      },
      { 
        key: 'ecuPins', 
        type: 'input', 
        message: 'ECU Pins (comma-separated):',
        transform: (val) => val.split(',').map(s => s.trim()).filter(Boolean)
      }
    ];
    
    const edits = {};
    
    for (const field of fields) {
      const currentValue = data[field.key];
      const defaultVal = Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue || '');
      
      const { value } = await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: field.message,
        default: defaultVal
      }]);
      
      edits[field.key] = field.transform ? field.transform(value) : value;
    }
    
    // Also update confidence if edited
    edits.confidence = 1.0;
    
    return edits;
  }
}

// CLI entry point
const args = require('minimist')(process.argv.slice(2));
const inputDir = args.input || config.inputDir;
const outputDir = args.output || config.outputDir;

// Validate API keys for analysis provider
const analysisProvider = config.analysis.provider;
if (analysisProvider === 'openrouter' && !config.analysis.openrouterApiKey) {
  console.error('Error: OPENROUTER_API_KEY is required for OpenRouter analysis provider.');
  process.exit(1);
}

if (config.translation?.enabled) {
  const transProvider = config.translation.provider;
  if (transProvider === 'openrouter' && !config.translation.openrouterApiKey) {
    console.error('Error: OPENROUTER_API_KEY is required for OpenRouter translation provider.');
    process.exit(1);
  }
}

const processor = new WiringDiagramProcessor();
processor.processDirectory(inputDir, outputDir)
  .then(() => {
    console.log('\n===== Summary =====');
    console.log(`Processed: ${processor.stats.processed}`);
    console.log(`Skipped: ${processor.stats.skipped}`);
    console.log(`Errors: ${processor.stats.errors}`);
    console.log('All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
