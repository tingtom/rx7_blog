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

  async groupImagesByIdentifier(files, inputDir) {
    const groups = new Map();
    console.log('Grouping images by identifier...');
    
    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      try {
        const analysisData = await this.analysisClient.analyzeImage(inputPath);
        const identifier = (analysisData.identifier || '').trim().toLowerCase();
        console.log(`  ${file}: identifier="${identifier}"`);
        if (!groups.has(identifier)) {
          groups.set(identifier, []);
        }
        groups.get(identifier).push(file);
      } catch (err) {
        console.warn(`  Failed to get identifier for ${file}: ${err.message}. Treating as single.`);
        if (!groups.has('')) groups.set('', []);
        groups.get('').push(file);
      }
    }
    return groups;
  }

  mergeGroupResults(identifier, results) {
    const merged = {
      _type: 'wiringDiagram',
      identifier: identifier || undefined,
      imageFilenames: results.flatMap(r => r.imageFilenames || (r.imageFilename ? [r.imageFilename] : [])),
      processedAt: new Date().toISOString()
    };

    let title = '', description = '', category = '', yearRange = '', notes = '';
    const wireColors = new Set(), components = new Set(), connectors = new Set(), ecuPins = new Set();
    let confidenceSum = 0, confidenceCount = 0;

    for (const r of results) {
      if (!title && r.title) title = r.title || '';
      if (!description && r.description) description = r.description || '';
      if (!category && r.category) category = r.category || '';
      if (!yearRange && r.yearRange) yearRange = r.yearRange || '';
      if (!notes && r.notes) notes = r.notes || '';

      (r.wireColors || []).forEach(c => wireColors.add(c));
      (r.components || []).forEach(c => components.add(c));
      (r.connectors || []).forEach(c => connectors.add(c));
      (r.ecuPins || []).forEach(c => ecuPins.add(c));

      if (r.confidence !== undefined) {
        confidenceSum += r.confidence;
        confidenceCount++;
      }
    }

    merged.wireColors = [...wireColors];
    merged.components = [...components];
    merged.connectors = [...connectors];
    merged.ecuPins = [...ecuPins];
    merged.title = title;
    merged.description = description;
    merged.category = category;
    merged.yearRange = yearRange;
    merged.notes = notes;

    if (confidenceCount > 0) {
      merged.confidence = confidenceSum / confidenceCount;
    }

    return merged;
  }

  async processDirectory(inputDir, outputDir) {
     // Ensure output directory exists
     fs.mkdirSync(outputDir, { recursive: true });

     const allResults = [];
     const jsonlPath = path.join(outputDir, 'all-diagrams.jsonl');
     if (fs.existsSync(jsonlPath)) fs.unlinkSync(jsonlPath);

     // Get all image files
     const files = fs.readdirSync(inputDir)
       .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));

     if (files.length === 0) {
       console.log(`No images found in ${inputDir}`);
       return;
     }

     console.log(`Found ${files.length} images.`);
     console.log(`Analysis model: ${config.analysis.provider}/${config.analysis.model}`);
     if (this.translationClient) {
       console.log(`Translation model: ${config.translation.provider}/${config.translation.model}`);
     } else {
       console.log('Translation: disabled (single-pass)');
     }
     console.log('');

     // Group images by identifier if enabled, else each image alone
     let groups;
     if (config.groupByIdentifier) {
       groups = await this.groupImagesByIdentifier(files, inputDir);
     } else {
       groups = new Map();
       files.forEach(f => groups.set(f, [f]));
     }

     console.log(`Grouping resulted in ${groups.size} group(s):`);
     for (const [id, groupFiles] of groups) {
       console.log(`  ${id || '(no identifier)'}: ${groupFiles.length} image(s)`);
     }
     console.log('');

     // Map to collect results and individual file paths for each group
     const groupEntries = new Map(); // key: identifier -> array of { result, individualPath }

     // Process each file (or read existing) and assign to groups
     for (const [identifier, groupFiles] of groups) {
       for (const file of groupFiles) {
         const inputPath = path.join(inputDir, file);
         const individualPath = path.join(outputDir, file.replace(/\.[^.]+$/, '.json'));
         let result = null;
         if (fs.existsSync(individualPath)) {
           console.log(`  Skipped (already exists): ${file}`);
           try {
             result = JSON.parse(fs.readFileSync(individualPath, 'utf-8'));
             // Normalize to new format if needed
             if (result.imageFilename && !result.imageFilenames) {
               result.imageFilenames = [result.imageFilename];
             }
             this.stats.skipped++;
           } catch (readErr) {
             console.warn(`  Failed to read existing result for ${file}: ${readErr.message}. Will reprocess.`);
           }
         }
         if (!result) {
           console.log(`  Processing: ${file}`);
           try {
             result = await this.processImage(inputPath, individualPath);
             if (result) {
               this.stats.processed++;
             }
           } catch (error) {
             // Error already logged by processImage
             this.stats.errors++;
             result = null;
           }
         }
         if (result) {
           if (!groupEntries.has(identifier)) {
             groupEntries.set(identifier, []);
           }
           groupEntries.get(identifier).push({ result, individualPath });
         }
       }
     }

     // Merge groups where needed
     const finalResults = [];
     const pathsToDelete = [];

     for (const [identifier, entries] of groupEntries) {
       if (entries.length > 1) {
         const merged = this.mergeGroupResults(identifier, entries.map(e => e.result));
         finalResults.push(merged);
         // Mark individual JSON files for deletion
         entries.forEach(e => pathsToDelete.push(e.individualPath));
       } else {
         finalResults.push(entries[0].result);
       }
     }

     // Write final JSONL
     for (const result of finalResults) {
       fs.appendFileSync(jsonlPath, JSON.stringify(result) + '\n');
     }

     // Delete individual files for merged groups
     for (const p of pathsToDelete) {
       try {
         fs.unlinkSync(p);
         console.log(`  Deleted individual: ${path.basename(p)}`);
       } catch (e) {
         // ignore
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
          imageFilenames: [path.basename(imagePath)],
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
    console.log(`Image: ${data.imageFilenames?.[0] || 'unknown'}`);
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
