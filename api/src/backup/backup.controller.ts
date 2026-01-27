import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Res,
  Header,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BackupService } from './backup.service.js';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
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
  @Header('Content-Type', 'application/octet-stream')
  downloadBackup(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: any,
  ): StreamableFile {
    const filePath = this.backupService.getBackupFile(filename);
    const file = createReadStream(filePath);
    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(file);
  }
}
