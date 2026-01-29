import { Module } from '@nestjs/common';
import { BranchService } from './branch.service.js';
import { BranchController } from './branch.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PublicHotelsService } from './public-hotels.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [BranchController],
  providers: [BranchService, PublicHotelsService],
  exports: [BranchService, PublicHotelsService],
})
export class BranchModule {}
