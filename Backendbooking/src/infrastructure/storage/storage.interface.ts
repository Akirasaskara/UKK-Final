export interface StorageService {
  uploadFile(
    prefix: string,
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ filename: string; url: string }>;

  deleteFile(objectKey: string): Promise<void>;

  getPublicUrl(prefix: string, filename: string): string;
}
