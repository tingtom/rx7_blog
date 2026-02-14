module.exports = {
  // Primary analysis provider and model
  provider: 'openrouter',
  model: 'openai/gpt-4-turbo',
  
  // API keys (set via environment variables)
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  
  // OpenRouter-specific settings
  openrouterReferer: process.env.OPENROUTER_REFERER || 'https://rx7.pro',
  openrouterAppName: process.env.OPENROUTER_APP_NAME || 'RX7 Wiring Processor',
  
  // Translation settings (optional second pass)
  enableTranslation: false, // Set true to run translation model after analysis
  translationProvider: 'openrouter', // Can be same or different provider
  translationModel: 'openai/gpt-4o-mini', // Cheaper text-only model
  // Translation uses same API keys as primary (but could be separate)
  
  // Processing settings
  confidenceThreshold: 0.8,
  maxRetries: 3,
  
  // Directories (adjust as needed)
  inputDir: './diagrams-to-process',
  outputDir: './processed-diagrams',
  
  // Whether to deduplicate array entries (connectors, etc.)
  deduplicateArrays: true,
};
