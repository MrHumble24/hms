import { Module } from '@nestjs/common';
import { EmehmonService } from './emehmon.service.js';
import { EmehmonController } from './emehmon.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [EmehmonService],
  controllers: [EmehmonController],
  exports: [EmehmonService],
})
export class EmehmonModule {}
