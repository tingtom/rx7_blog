const fs = require('fs');

// Polyfill fetch for Node.js < 18
if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = require("cross-fetch");
}

class VisionClient {
  constructor(config, customPrompt = null) {
    this.config = config;
    this.customPrompt = customPrompt;
    this.maxRetries = config.maxRetries || 3;
    this.baseDelay = 1000; // 1 second base for exponential backoff
  }
  
  async analyzeImage(imagePath) {
    const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });
    const mime = this.getMimeType(imagePath);
    
    if (this.config.provider === 'openai') {
      return await this.openaiAnalyze(base64, mime);
    } else if (this.config.provider === 'anthropic') {
      return await this.anthropicAnalyze(base64, mime);
    } else if (this.config.provider === 'openrouter') {
      return await this.openrouterAnalyze(base64, mime);
    } else {
      throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }
  
  getMimeType(path) {
    const ext = path.split('.').pop().toLowerCase();
    const map = { 
      png: 'image/png', 
      jpg: 'image/jpeg', 
      jpeg: 'image/jpeg', 
      gif: 'image/gif', 
      webp: 'image/webp', 
      svg: 'image/svg+xml' 
    };
    return map[ext] || 'image/png';
  }
  
  async fetchWithRetry(requestFn, retryableStatuses = [408, 429, 500, 502, 503, 504]) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1); // exponential backoff
          console.log(`    Retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries + 1})...`);
          await this.sleep(delay);
        }
        
        return await requestFn();
        
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const status = error.status || error.code;
        const isRetryable = retryableStatuses.includes(status) || 
                           error.message.includes('Network connection lost') ||
                           error.message.includes('fetch failed');
        
        if (!isRetryable || attempt >= this.maxRetries) {
          // Include response body if available for more context
          if (error.body) {
            try {
              const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
              const snippet = JSON.stringify(body).substring(0, 300);
              error.message += ` (Response: ${snippet}${JSON.stringify(body).length > 300 ? '...' : ''})`;
            } catch (e) {
              // ignore parse errors
            }
          }
          console.error(`  Error after ${attempt + 1} attempts: ${error.message} (status: ${status || 'none'})`);
          throw error;
        }
        
        console.warn(`  Attempt ${attempt + 1} failed: ${error.message}. Retrying...`);
      }
    }
    
    throw lastError;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async openaiAnalyze(base64, mime) {
    const body = {
      model: this.config.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: this.getPrompt() },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
        ]
      }],
      temperature: 0.3
    };
    if (this.config.useJsonMode) {
      body.response_format = { type: 'json_object' };
    }
    
    const requestFn = () => fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify(body)
    }).then(async response => {
      const data = await response.json();
      if (!response.ok || data.error) {
        const err = new Error(data.error?.message || data.error?.code || 'OpenAI API error');
        err.status = response.status;
        err.body = data;
        throw err;
      }
      return data;
    }).then(data => {
      try {
        const content = JSON.parse(data.choices[0].message.content);
        return content;
      } catch (parseErr) {
        throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}. Response: ${data.choices[0].message.content.substring(0, 200)}`);
      }
    });
    
    return await this.fetchWithRetry(requestFn);
  }
  
  async anthropicAnalyze(base64, mime) {
    const requestFn = () => fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: this.getPrompt() },
            { 
              type: 'image', 
              source: { 
                type: 'base64', 
                media_type: mime, 
                data: base64 
              } 
            }
          ]
        }],
        temperature: 0.3
      })
    }).then(async response => {
      const data = await response.json();
      if (!response.ok || data.error) {
        const err = new Error(data.error?.message || data.error?.type || 'Anthropic API error');
        err.status = response.status;
        err.body = data;
        throw err;
      }
      return data;
    }).then(data => {
      try {
        const content = data.content[0].text;
        return JSON.parse(content);
      } catch (parseErr) {
        throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}. Response: ${data.content[0].text.substring(0, 200)}`);
      }
    });
    
    return await this.fetchWithRetry(requestFn);
  }
  
   async openrouterAnalyze(base64, mime) {
     // Check if this is an image generation request (for translation with image output)
     const generateImage = this.config.generateImage;
     
     const body = {
       model: this.config.model,
       messages: [{
         role: 'user',
         content: [
           { type: 'text', text: this.getPrompt() },
           { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
         ]
       }],
       temperature: 0.3
     };
     
     // Add modalities for image generation models
     if (generateImage) {
       body.modalities = ['image', 'text'];
     } else if (this.config.useJsonMode) {
       body.response_format = { type: 'json_object' };
     }
     
     const requestFn = () => fetch('https://openrouter.ai/api/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${this.config.openrouterApiKey}`,
         'HTTP-Referer': this.config.openrouterReferer,
         'X-Title': this.config.openrouterAppName
       },
       body: JSON.stringify(body)
     }).then(async response => {
       const data = await response.json();
       if (!response.ok || data.error) {
         const err = new Error(data.error?.message || data.error?.code || 'OpenRouter API error');
         err.status = response.status;
         err.body = data;
         throw err;
       }
       return data;
     }).then(data => {
       const message = data.choices[0].message;
       
       // Check if image generation was requested and image is present
       if (this.config.generateImage) {
         if (message.images && message.images.length > 0) {
           const imageData = message.images[0].image_url.url; // base64 data URL
           return { _generatedImage: imageData };
         } else {
           throw new Error('Image generation requested but no image returned. Response contains only text.');
         }
       } else {
         // Text-only mode - parse content as JSON
         try {
           const content = JSON.parse(message.content);
           return content;
         } catch (parseErr) {
           throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}. Response: ${message.content?.substring(0, 200) || 'empty'}`);
         }
       }
     });
     
     return await this.fetchWithRetry(requestFn);
   }
  
  getPrompt() {
    // If a custom prompt is provided, use it; otherwise use default analysis prompt
    if (this.customPrompt) {
      return this.customPrompt;
    }
    return `Analyze this Mazda RX-7 FD3S wiring diagram image. Translate any Japanese text to English.

IMPORTANT: Return ONLY valid JSON with these exact keys. Do not include markdown or code block formatting.

{
  "title": "Descriptive title including system and year if visible",
  "wireColors": ["Red", "Black", "Green/White", ...],
  "components": ["ECU", "fuel pump", "starter motor", ...],
  "connectors": ["FPC", "EPC", "10P", "16P", ...],
  "ecuPins": ["ECU pin 1", "pin 20", "FPC pin 32", ...],
  "category": "Free-text category like Engine/ECU, Lighting, Transmission, etc.",
  "yearRange": "1992-1995, 1996-1998, 1999-2002, or All Years",
  "description": "One-sentence summary of what this diagram shows",
  "notes": "Any legends, voltage references, ground points, special instructions",
  "confidence": 0.95
}

Guidelines:
- Wire colors: include striped wires like "Red/Black", "Green/White"
- Components: include all major parts (ECU, sensors, relays, motors, switches, solenoids)
- Connectors: include connector names like "FPC", "EPC", "MPC", "10P" (10-pin), "16P", etc.
- ECU Pins: include pin numbers like "ECU pin 1", "FPC pin 32", "pin 20"
- Category: use appropriate system name (Engine/ECU, Lighting, Interior, Exterior, Fuel, Cooling, Audio, Airbag, Security, HVAC, Sensors, Transmission, Other)
- Confidence: 0-1 estimate of extraction accuracy based on diagram clarity and completeness`;
  }
}

module.exports = VisionClient;
