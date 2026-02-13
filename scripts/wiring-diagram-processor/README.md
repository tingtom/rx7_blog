# Wiring Diagram AI Processor

Extract structured metadata from Mazda RX-7 FD3S wiring diagrams using AI vision models.

## Features

- Processes PNG, JPG, GIF, WebP, SVG images
- Uses GPT-4 Turbo, Claude 3.5 Sonnet, or OpenRouter models
- Extracts: wire colors, components, connectors, ECU pins, category, year range
- Translates Japanese text to English
- Interactive review for low-confidence extractions
- Outputs individual JSON files ready for Sanity import

## Setup

1. Install dependencies:
```bash
cd scripts/wiring-diagram-processor
npm init -y
npm install inquirer minimist
```

2. Set up API key:

**For OpenAI:**
```bash
export OPENAI_API_KEY="sk-..."
```

**For Anthropic Claude:**
```bash
export ANTHROPIC_API_KEY="sk-..."
```

**For OpenRouter (recommended - multiple models in one):**
```bash
export OPENROUTER_API_KEY="sk-or-..."
# Optional: set referer and app name for OpenRouter analytics
export OPENROUTER_REFERER="https://rx7.pro"
export OPENROUTER_APP_NAME="RX7 Wiring Processor"
```

3. Edit `config.js` to choose provider and model:
```javascript
provider: 'openrouter',  // 'openai', 'anthropic', or 'openrouter'
model: 'openai/gpt-4-turbo', // or 'anthropic/claude-3.5-sonnet'
```

## Usage

1. Place your wiring diagram images in a folder (e.g., `diagrams-to-process/`)

2. Run the processor:
```bash
node cli.js --input ./diagrams-to-process --output ./processed-diagrams
```

3. Review and edit any diagrams with low confidence (< 80% by default)

4. Output: Individual JSON files in `./processed-diagrams/`

## Workflow

1. 📁 Upload images to **Sanity Assets** via Sanity Studio
2. 🤖 Run this script to generate metadata JSON files
3. 📝 In Sanity Studio, create new "Wiring Diagram" documents
4. 📋 Copy fields from JSON into the document
5. 🔗 Link the `diagramImage` field to the uploaded asset
6. ✅ Publish the document

## Command Options

```bash
node cli.js \
  --input /path/to/images \
  --output /path/to/output \
  [--provider openrouter] \
  [--model openai/gpt-4-turbo]
```

Options are read from `config.js`, but can be overridden via CLI arguments if needed (extend script for that).

## Configuration (`config.js`)

| Option | Default | Description |
|--------|---------|-------------|
| `provider` | `'openrouter'` | AI provider: 'openai', 'anthropic', 'openrouter' |
| `model` | `'openai/gpt-4-turbo'` | Model identifier (varies by provider) |
| `openrouterApiKey` | `process.env.OPENROUTER_API_KEY` | OpenRouter API key |
| `confidenceThreshold` | `0.8` | Auto-accept above this (0-1) |
| `deduplicateArrays` | `true` | Remove duplicate entries in arrays |

## Output JSON Structure

```json
{
  "_type": "wiringDiagram",
  "title": "ECU Engine Wiring (1993-1995)",
  "description": "Shows the main engine control unit wiring harness...",
  "imageFilename": "engine-ecu-1993.png",
  "wireColors": ["Red", "Black", "Green/White", "Yellow"],
  "components": ["ECU", "fuel pump", "starter motor", "alternator"],
  "connectors": ["FPC", "EPC", "10P", "16P"],
  "ecuPins": ["ECU pin 1", "pin 20", "FPC pin 32"],
  "category": "Engine/ECU",
  "yearRange": "1993-1995",
  "notes": "B+ = constant 12V, G = ground",
  "confidence": 0.92,
  "processedAt": "2024-02-13T..."
}
```

## OpenRouter Models

Popular models you can use:

- `openai/gpt-4-turbo` - Strong vision, fast
- `openai/gpt-4o` - Latest, good balance
- `anthropic/claude-3.5-sonnet` - Excellent reasoning
- `anthropic/claude-3-opus` - Most capable (slower)

See [OpenRouter Models](https://openrouter.ai/models) for full list.

## Tips

- Ensure images are clear and readable for best extraction
- For complex diagrams with lots of text, higher resolution works better
- Use interactive review for first few diagrams to calibrate expectations
- The AI may miss some pins or components - always spot-check results
- Edit JSON manually after review if needed

## Troubleshooting

**Error: Insufficient credentials**
- Check that your API key environment variable is set correctly
- For OpenRouter, ensure you have credits in your account

**Poor extraction quality**
- Try a different model (e.g., `claude-3.5-sonnet` often better for structured extraction)
- Increase image resolution/contrast
- Manually edit during review

**SVG images not working**
- Some providers may not support SVG. Convert to PNG first.

## License

Part of the rx7.pro blog project.