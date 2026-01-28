export interface StorageProvider {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
