export interface StoredFile {
  filename: string;
  objectKey: string;
  url: string;
}

export interface StorageService {
  uploadFile(
    prefix: string,
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<StoredFile>;

  deleteFile(objectKey: string): Promise<void>;

  getPublicUrl(prefix: string, filename: string): string;
}
