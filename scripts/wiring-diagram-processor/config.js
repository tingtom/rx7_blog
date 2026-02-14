module.exports = {
  // Analysis model: extracts all fields from the image
  analysis: {
    provider: 'openrouter',
    model: 'openai/gpt-4-turbo',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterReferer: process.env.OPENROUTER_REFERER || 'https://rx7.pro',
    openrouterAppName: process.env.OPENROUTER_APP_NAME || 'RX7 Wiring Processor',
  },
  
  // Translation model: optional second vision pass to translate Japanese text
  // If enabled, this model will process the same image and its text fields will override
  // those from the analysis model.
  translation: {
    enabled: false,
    provider: 'openrouter',
    model: 'openai/gpt-4o', // Capable vision model for translation
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterReferer: process.env.OPENROUTER_REFERER || 'https://rx7.pro',
    openrouterAppName: process.env.OPENROUTER_APP_NAME || 'RX7 Wiring Processor',
  },
  
  // Processing settings
  confidenceThreshold: 0.8,
  maxRetries: 3,
  
  // Directories (adjust as needed)
  inputDir: './diagrams-to-process',
  outputDir: './processed-diagrams',
  
  // Whether to deduplicate array entries (connectors, etc.)
  deduplicateArrays: true,
};
