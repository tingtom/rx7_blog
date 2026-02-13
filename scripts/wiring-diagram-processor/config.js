module.exports = {
  // Provider: 'openai', 'anthropic', or 'openrouter'
  provider: 'openrouter',
  
  // Model based on provider:
  // OpenAI: 'gpt-4-turbo', 'gpt-4o', 'gpt-4-vision-preview'
  // Anthropic: 'claude-3-5-sonnet-20241022', 'claude-3-opus'
  // OpenRouter: 'openai/gpt-4-turbo', 'anthropic/claude-3.5-sonnet', etc.
  model: 'openai/gpt-4-turbo',
  
  // API keys (set via environment variables)
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  
  // OpenRouter-specific settings
  openrouterReferer: process.env.OPENROUTER_REFERER || 'https://rx7.pro',
  openrouterAppName: process.env.OPENROUTER_APP_NAME || 'RX7 Wiring Processor',
  
  // Processing settings
  confidenceThreshold: 0.8,
  maxRetries: 3,
  
  // Directories (adjust as needed)
  inputDir: './diagrams-to-process',
  outputDir: './processed-diagrams',
  
  // Whether to deduplicate array entries (connectors, etc.)
  deduplicateArrays: true,
};
