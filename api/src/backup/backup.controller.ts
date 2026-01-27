import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import * as express from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { BackupService } from './backup.service.js';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { UserRole } from '@prisma/client';

@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createBackup() {
    const filePath = await this.backupService.createBackup('manual');
    await this.backupService.sendToTelegram(filePath);
    return { message: 'Backup created and sent to Telegram', filePath };
  }

  @Post('restore')
  @UseInterceptors(FileInterceptor('file'))
  async restoreBackup(
    @UploadedFile() file: Express.Multer.File,
    @Body('secret') secret: string,
  ) {
    return this.backupService.restoreBackup(file, secret);
  }

  @Get()
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Get(':filename')
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    const filePath = this.backupService.getBackupFile(filename);
    res.download(filePath);
  }
}
