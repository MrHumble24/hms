export abstract class StorageProvider {
  abstract uploadFile(file: Express.Multer.File): Promise<string>;
  abstract deleteFile(path: string): Promise<void>;
}
