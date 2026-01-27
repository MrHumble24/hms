import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service.js';
import { GuestsController } from './guests.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}
