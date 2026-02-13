const fs = require('fs');

class VisionClient {
  constructor(config) {
    this.config = config;
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
  
  async openaiAnalyze(base64, mime) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: this.getPrompt() },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
          ]
        }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const content = JSON.parse(data.choices[0].message.content);
    return content;
  }
  
  async anthropicAnalyze(base64, mime) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const content = data.content[0].text;
    const parsed = JSON.parse(content);
    return parsed;
  }
  
  async openrouterAnalyze(base64, mime) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openrouterApiKey}`,
        'HTTP-Referer': this.config.openrouterReferer,
        'X-Title': this.config.openrouterAppName
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: this.getPrompt() },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
          ]
        }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data));
    const content = JSON.parse(data.choices[0].message.content);
    return content;
  }
  
  getPrompt() {
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