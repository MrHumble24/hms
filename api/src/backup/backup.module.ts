import { Module } from '@nestjs/common';
import { BackupService } from './backup.service.js';
import { BackupController } from './backup.controller.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
