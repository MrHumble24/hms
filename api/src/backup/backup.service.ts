import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import TelegramBot from 'node-telegram-bot-api';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import 'dotenv/config';

const execAsync = util.promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private bot: TelegramBot;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      this.bot = new TelegramBot(token, { polling: false });
    } else {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not provided, Telegram integration disabled.',
      );
    }

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyBackup() {
    this.logger.log('Starting daily backup...');
    try {
      const filePath = await this.createBackup('daily');
      await this.sendToTelegram(filePath);
      // Optional: Cleanup old backups?
      // For now, let's keep it simple.
    } catch (error) {
      this.logger.error('Daily backup failed', error);
      if (this.bot && this.chatId) {
        this.bot.sendMessage(
          this.chatId,
          `❌ Daily Backup Failed: ${error.message}`,
        );
      }
    }
  }

  async createBackup(prefix: string = 'manual'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${prefix}-${timestamp}.sql`; // Using plain SQL dump for easier restore/inspection if needed, or custom format for pg_restore
    // pg_dump -U user -h host -d db > file
    // Recommended to use -Fc (custom format) for pg_restore, but text matches "send to telegram" better if small?
    // Actually, binary format is better for restore reliability.

    // Let's use custom format (-Fc) which is compressed by default.
    const filenameTar = `backup-${prefix}-${timestamp}.dump`;
    const filePath = path.join(this.backupDir, filenameTar);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found');
    }

    // Parse DB URL or just pass it if pg_dump supports it (it usually does).
    // Safest is to set PGPASSWORD env var and parse other parts, or just pass connection string.

    // Fix: pg_dump doesn't like query params like ?schema=public
    const urlObj = new URL(dbUrl);
    urlObj.search = '';
    const cleanDbUrl = urlObj.toString();

    const command = `pg_dump "${cleanDbUrl}" -F c -f "${filePath}"`;

    this.logger.log(`Executing backup command: ${command}`);

    try {
      await execAsync(command);
      this.logger.log(`Backup created at ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error('Backup creation failed', error);
      if (error.stderr) {
        this.logger.error(`pg_dump stderr: ${error.stderr}`);
      }
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreBackup(file: Express.Multer.File, secret: string) {
    if (secret !== process.env.EMERGENCY_RESTORE_SECRET) {
      throw new UnauthorizedException('Invalid emergency restore secret');
    }

    const backupPath = path.join(this.backupDir, `restore-${Date.now()}.dump`);
    fs.writeFileSync(backupPath, file.buffer);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found');
    }

    // Fix: pg_restore doesn't like query params like ?schema=public
    const urlObj = new URL(dbUrl);
    urlObj.search = '';
    const cleanDbUrl = urlObj.toString();

    // pg_restore -d dbUrl -c (clean) --if-exists backupFile
    const command = `pg_restore -d "${cleanDbUrl}" --clean --if-exists "${backupPath}"`;

    this.logger.log(`Executing restore command: ${command}`);

    try {
      await execAsync(command);
      this.logger.log('System restored successfully');

      // Cleanup uploaded file
      fs.unlinkSync(backupPath);

      return { success: true, message: 'System restored successfully' };
    } catch (error) {
      this.logger.error('Restore failed', error);
      throw new BadRequestException('Restore failed: ' + error.message);
    }
  }

  async sendToTelegram(filePath: string) {
    if (!this.bot || !this.chatId) {
      this.logger.warn(
        `Telegram integration disabled. Token: ${!!this.bot}, ChatID: ${!!this.chatId}`,
      );
      return;
    }

    if (!fs.existsSync(filePath)) {
      this.logger.error(`File not found for Telegram upload: ${filePath}`);
      throw new Error('Backup file not found for upload');
    }

    try {
      this.logger.log(
        `Sending backup to Telegram chat ${this.chatId}... File: ${filePath}`,
      );
      const fileStream = fs.createReadStream(filePath);
      await this.bot.sendDocument(
        this.chatId,
        fileStream,
        {
          caption: `📦 Database Backup\n📅 ${new Date().toLocaleString()}`,
        },
        {
          filename: path.basename(filePath),
          contentType: 'application/octet-stream',
        },
      );
      this.logger.log('Backup sent to Telegram successfully');
    } catch (error) {
      this.logger.error('Failed to send backup to Telegram', error);
      if (error.response) {
        this.logger.error(
          `Telegram API Error: ${JSON.stringify(error.response.body)}`,
        );
      }
      // We don't throw here to ensure the user still knows the local backup succeeded,
      // but ideally we return a warning. For now, let's keep it non-blocking but noisy in logs.
      throw new BadRequestException(
        `Backup created but failed to send to Telegram: ${error.message}`,
      );
    }
  }

  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = await fs.promises.readdir(this.backupDir);
      const backups = await Promise.all(
        files
          .filter(
            (f) =>
              f.startsWith('backup-') &&
              (f.endsWith('.dump') || f.endsWith('.sql')),
          )
          .map(async (filename) => {
            const stats = await fs.promises.stat(
              path.join(this.backupDir, filename),
            );
            return {
              filename,
              size: stats.size,
              createdAt: stats.birthtime,
            };
          }),
      );

      return backups.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (error) {
      this.logger.error('Failed to list backups', error);
      return [];
    }
  }

  getBackupFile(filename: string): string {
    // Basic security check to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.backupDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Backup file not found');
    }

    return filePath;
  }
}
