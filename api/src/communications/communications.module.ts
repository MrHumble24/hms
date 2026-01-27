import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service.js';
import { CommunicationsController } from './communications.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
