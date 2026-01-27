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
    } else {
      this.logger.warn('AI_API_KEY not found in environment');
    }
  }

  async estimateCalories(
    name: string,
    ingredients: string,
  ): Promise<number | null> {
    if (!this.genAI) {
      this.logger.warn('Gemini AI not initialized (missing API key)');
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      const prompt = `Estimate the total calories for a dish named "${name}" with the following ingredients: "${ingredients}". Return ONLY the numeric value (approximate total calories). If you cannot estimate, return "0".`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Extract number from response (Gemini might return text with the number)
      const match = text.match(/\d+/);
      const calories = match ? parseFloat(match[0]) : 0;

      return calories;
    } catch (error) {
      this.logger.error('Error estimating calories with Gemini', error);
      return null;
    }
  }
}
