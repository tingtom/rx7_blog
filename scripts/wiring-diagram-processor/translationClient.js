class TranslationClient {
  constructor(config) {
    this.config = config;
    this.provider = config.translationProvider || config.provider;
    this.model = config.translationModel || config.model;
  }

  async translateFields(data) {
    // Extract fields that need translation
    const fieldsToTranslate = {
      title: data.title,
      description: data.description,
      notes: data.notes,
      category: data.category,
      yearRange: data.yearRange,
      components: data.components,
      connectors: data.connectors,
      ecuPins: data.ecuPins,
    };

    // Remove empty/undefined fields
    Object.keys(fieldsToTranslate).forEach(
      (key) => fieldsToTranslate[key] == null && delete fieldsToTranslate[key]
    );

    const systemPrompt = `You are a professional translator specializing in Japanese to English for Mazda RX-7 FD3S automotive wiring diagrams. Your task is to translate Japanese text to English while preserving technical terms, part numbers, and proper names. If the text is already in English, leave it unchanged. Return ONLY valid JSON with the exact same structure (arrays remain arrays, strings remain strings). Do not add any extra commentary.`;

    const userMessage = `Translate these fields to English:\n\n${JSON.stringify(fieldsToTranslate, null, 2)}`;

    if (this.provider === 'openai') {
      return await this.openaiTranslate(systemPrompt, userMessage);
    } else if (this.provider === 'anthropic') {
      return await this.anthropicTranslate(systemPrompt, userMessage);
    } else if (this.provider === 'openrouter') {
      return await this.openrouterTranslate(systemPrompt, userMessage);
    } else {
      throw new Error(`Unknown translation provider: ${this.provider}`);
    }
  }

  async openaiTranslate(system, user) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  }

  async anthropicTranslate(system, user) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: system,
        messages: [{ role: 'user', content: user }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const content = data.content[0].text;
    return JSON.parse(content);
  }

  async openrouterTranslate(system, user) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openrouterApiKey}`,
        'HTTP-Referer': this.config.openrouterReferer,
        'X-Title': this.config.openrouterAppName,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data));
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  }
}

module.exports = TranslationClient;
