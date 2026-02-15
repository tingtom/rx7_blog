module.exports = {
  // Analysis model: extracts all fields from the image
  analysis: {
    provider: 'openrouter',
    model: 'nvidia/nemotron-nano-12b-v2-vl:free',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterReferer: process.env.OPENROUTER_REFERER || 'https://rx7.pro',
    openrouterAppName: process.env.OPENROUTER_APP_NAME || 'RX7 Wiring Processor',
    // Set to false for models that don't support JSON mode (e.g., Gemini via OpenRouter)
    useJsonMode: true,
  },
  
   // Translation model: optional second vision pass to translate Japanese text
   // If enabled, this model will process the same image and its text fields will override
   // those from the analysis model. For image-generation models (like Gemini 2.5 Flash Image),
   // this will also generate a translated image.
   translation: {
     enabled: true,
     provider: 'openrouter',
     model: 'google/gemini-2.5-flash-image-preview', // Image generation model (preview)
     openaiApiKey: process.env.OPENAI_API_KEY,
     anthropicApiKey: process.env.ANTHROPIC_API_KEY,
     openrouterApiKey: process.env.OPENROUTER_API_KEY,
     openrouterReferer: process.env.OPENROUTER_REFERER || 'https://rx7.pro',
     openrouterAppName: process.env.OPENROUTER_APP_NAME || 'RX7 Wiring Processor',
     // For image generation models: useJsonMode must be false, and we set modalities
     useJsonMode: false,
     generateImage: true, // Enable image generation (for compatible models)
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
