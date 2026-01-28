import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async translate(
    text: string,
  ): Promise<{ en: string; uz: string; ru: string }> {
    if (!this.genAI) {
      throw new Error('AI Service not configured: Missing AI_API_KEY');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = `
        Translate the following text into English, Uzbek, and Russian.
        Return the result ONLY as a valid JSON object with keys "en", "uz", and "ru".
        If the text is already in one of these languages, keep it or refine it.
        
        Text to translate: "${text}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text();

      // Clean the response if it contains markdown code blocks
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0].trim();
      } else if (responseText.includes('```')) {
        responseText = responseText.split('```')[1].split('```')[0].trim();
      }

      const translations = JSON.parse(responseText);

      return {
        en: translations.en || text,
        uz: translations.uz || text,
        ru: translations.ru || text,
      };
    } catch (error) {
      this.logger.error(`AI Translation error: ${error.message}`);
      throw new Error('Failed to translate text using AI');
    }
  }
}
