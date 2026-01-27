import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service.js';
import { RestaurantController } from './restaurant.controller.js';
import { AiService } from './ai.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [RestaurantService, AiService],
  controllers: [RestaurantController],
})
export class RestaurantModule {}
