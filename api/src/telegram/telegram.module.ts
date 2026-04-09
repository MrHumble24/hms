import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { PublicBookingService } from './public-booking.service.js';
import { PublicBookingController } from './public-booking.controller.js';
import { BranchModule } from '../branch/branch.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [BranchModule, PrismaModule],
  controllers: [PublicBookingController],
  providers: [TelegramService, PublicBookingService],
  exports: [TelegramService, PublicBookingService],
})
export class TelegramModule {}
