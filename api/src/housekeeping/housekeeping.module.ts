import { Module } from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service.js';
import { HousekeepingController } from './housekeeping.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [HousekeepingService],
  controllers: [HousekeepingController],
})
export class HousekeepingModule {}
