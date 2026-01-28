import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { LocalStorageProvider } from './local-storage.provider.js';

@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: () => {
        const storageType = process.env.STORAGE_TYPE || 'local';

        switch (storageType) {
          case 'local':
            return new LocalStorageProvider();
          // case 's3':
          //   return new S3StorageProvider();
          default:
            return new LocalStorageProvider();
        }
      },
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}
