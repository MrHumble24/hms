import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  async translate(
    text: string,
  ): Promise<{ en: string; uz: string; ru: string }> {
    if (!this.openai) {
      this.logger.error('OpenAI API Key is missing in environment variables');
      throw new Error('AI Service not configured: Missing OPENAI_API_KEY');
    }

    try {
      this.logger.log(
        `Translating: "${text.substring(0, 20)}..." using gpt-4o-mini`,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Translate to English (en), Uzbek (uz), Russian (ru). Output ONLY JSON: {"en": "...", "uz": "...", "ru": "..."}',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const translations = JSON.parse(content);

      return {
        en: translations.en || text,
        uz: translations.uz || text,
        ru: translations.ru || text,
      };
    } catch (error) {
      this.logger.error(`OpenAI Error: ${error.message}`);
      throw new Error(`AI Translation failed: ${error.message}`);
    }
  }
}
