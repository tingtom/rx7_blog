#!/usr/bin/env node

require("dotenv").config();
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const VisionClient = require('./visionClient');
const config = require('./config');

// Translation prompt specifically for translating Japanese to English
const TRANSLATION_PROMPT = `You are a specialized translator for Japanese automotive wiring diagrams. Your task is to extract the SAME JSON structure as the analysis model, but with ALL Japanese text fully translated to English.

IMPORTANT: Return ONLY valid JSON with these exact keys. Do not include markdown or code block formatting.

{
  "title": "English title (translate if Japanese)",
  "wireColors": ["Red", "Black", ...], // keep colors as-is, they are usually universal
  "components": ["ECU", "fuel pump", ...], // TRANSLATE all component names to English
  "connectors": ["FPC", "EPC", ...], // TRANSLATE connector names (e.g., 接続端子 -> Connector Terminal)
  "ecuPins": ["ECU pin 1", ...], // TRANSLATE any Japanese text, keep pin numbers
  "category": "Engine/ECU", // Already in English, keep or refine
  "yearRange": "1993-1995", // Already fine
  "description": "English description (fully translated)",
  "notes": "English notes (translate all Japanese text, keep symbols/numbers)",
  "confidence": 0.95
}

Guidelines:
- Focus on translating ALL Japanese text to natural English
- Preserve numbers, wire color names, pin numbers, symbols exactly
- For components/connectors: convert Japanese terms to standard RX-7 English terminology
- If text is already English, keep it unchanged
- Ensure translations are concise and accurate`;

class WiringDiagramProcessor {
  constructor() {
    this.analysisClient = new VisionClient(config.analysis);
    if (config.translation?.enabled) {
      this.translationClient = new VisionClient(config.translation, TRANSLATION_PROMPT);
      console.log('✓ Translation enabled using model:', config.translation.model);
    } else {
      this.translationClient = null;
    }
    this.stats = { processed: 0, skipped: 0, errors: 0 };
  }

  async processDirectory(inputDir, outputDir) {
    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Get all image files
    const files = fs.readdirSync(inputDir)
      .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));
    
    if (files.length === 0) {
      console.log(`No images found in ${inputDir}`);
      return;
    }
    
    console.log(`Found ${files.length} images to process.\n`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
      
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace(/\.[^.]+$/, '.json'));
      
      // Skip if already processed
      if (fs.existsSync(outputPath)) {
        console.log(`  Already exists, skipping.`);
        this.stats.skipped++;
        continue;
      }
      
      try {
        await this.processImage(inputPath, outputPath);
        this.stats.processed++;
      } catch (error) {
        console.error(`  Error: ${error.message}`);
        this.stats.errors++;
      }
    }
  }
  
  async processImage(imagePath, outputPath) {
    try {
      console.log('  Analyzing...');
      const analysisData = await this.analysisClient.analyzeImage(imagePath);
      
      let data = analysisData;
      if (this.translationClient) {
        console.log('  Translating...');
        const translatedData = await this.translationClient.analyzeImage(imagePath);
        // Merge: override text fields from analysis with translated ones
        data = this.mergeResults(analysisData, translatedData);
      }

      // Deduplicate arrays if configured
      if (config.deduplicateArrays) {
        ['wireColors', 'components', 'connectors', 'ecuPins'].forEach((field) => {
          if (Array.isArray(data[field])) {
            data[field] = [...new Set(data[field].map(String).map((s) => s.trim()))].filter(Boolean);
          }
        });
      }
      
      // Add metadata
      const result = {
        ...data,
        imageFilename: path.basename(imagePath),
        processedAt: new Date().toISOString(),
        _type: 'wiringDiagram',
      };
      
      // Review if confidence is low
      const needsReview = (result.confidence || 0) < config.confidenceThreshold;
      
      if (needsReview) {
        const edited = await this.reviewResult(result);
        if (edited === null) {
          console.log('  Skipped by user.');
          return;
        }
        Object.assign(result, edited);
      }
      
      // Save JSON
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`  ✓ Saved: ${outputPath}\n`);
      
    } catch (error) {
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
    
    // Optionally, we could also take category/yearRange from translation if present
    // but we'll keep analysis values for those as they might be more accurate for categorization
    
    return merged;
  }
  
  async reviewResult(data) {
    console.log('\n----- Review -----');
    console.log(`Image: ${data.imageFilename}`);
    console.log(`Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`Title: ${data.title}`);
    console.log(`Category: ${data.category}`);
    console.log(`Wire Colors: ${data.wireColors?.join(', ') || 'none'}`);
    console.log(`Components: ${data.components?.join(', ') || 'none'}`);
    console.log(`Connectors: ${data.connectors?.join(', ') || 'none'}`);
    console.log(`ECU Pins: ${data.ecuPins?.join(', ') || 'none'}`);
    console.log(`Year Range: ${data.yearRange || 'none'}`);
    console.log('------------------\n');
    
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
