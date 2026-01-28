import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

class TranslateDto {
  text: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('translate')
  async translate(@Body() translateDto: TranslateDto) {
    return this.aiService.translate(translateDto.text);
  }
}
