import { Injectable, Inject } from '@nestjs/common';
import type { StorageProvider } from './storage.provider.js';

@Injectable()
export class UploadService {
  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: StorageProvider,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<string> {
    return this.storageProvider.uploadFile(file);
  }

  async deleteFile(path: string): Promise<void> {
    return this.storageProvider.deleteFile(path);
  }
}
