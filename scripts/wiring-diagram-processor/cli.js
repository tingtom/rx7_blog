#!/usr/bin/env node

const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const VisionClient = require('./visionClient');
const config = require('./config');

class WiringDiagramProcessor {
  constructor() {
    this.client = new VisionClient(config);
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
    
    console.log('\n===== Summary =====');
    console.log(`Processed: ${this.stats.processed}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
  }
  
  async processImage(imagePath, outputPath) {
    const data = await this.client.analyzeImage(imagePath);
    
    // Ensure arrays are arrays and deduplicate if configured
    const result = {
      ...data,
      imageFilename: path.basename(imagePath),
      processedAt: new Date().toISOString(),
      _type: 'wiringDiagram'
    };
    
    // Deduplicate arrays if configured
    if (config.deduplicateArrays) {
      ['wireColors', 'components', 'connectors', 'ecuPins'].forEach(field => {
        if (Array.isArray(result[field])) {
          result[field] = [...new Set(result[field].map(String).map(s => s.trim()))].filter(Boolean);
        }
      });
    }
    
    // Review if confidence is low
    const needsReview = data.confidence < config.confidenceThreshold;
    
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
    console.log(`  Saved: ${outputPath}\n`);
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

if (!config.openrouterApiKey && config.provider === 'openrouter') {
  console.error('Error: OPENROUTER_API_KEY environment variable is required for OpenRouter provider.');
  process.exit(1);
}

const processor = new WiringDiagramProcessor();
processor.processDirectory(inputDir, outputDir)
  .then(() => {
    console.log('\nAll done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });