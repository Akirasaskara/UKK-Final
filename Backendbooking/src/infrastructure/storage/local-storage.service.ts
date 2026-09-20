import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import type { StoredFile, StorageService } from './storage.interface.js';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseUploadDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');

  constructor() {
    this.ensureDir(path.join(this.baseUploadDir, 'general'));
    this.ensureDir(path.join(this.baseUploadDir, 'spaces'));
    this.ensureDir(path.join(this.baseUploadDir, 'members'));
  }

  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async uploadFile(
    prefix: string,
    filename: string,
    buffer: Buffer,
    _mimetype: string,
  ): Promise<StoredFile> {
    const targetDir = path.join(this.baseUploadDir, prefix);
    this.ensureDir(targetDir);

    const targetPath = path.join(targetDir, filename);
    await fs.promises.writeFile(targetPath, buffer);

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    return {
      filename,
      objectKey: `${prefix}/${filename}`,
      url: `${baseUrl.replace(/\/+$/, '')}/uploads/${prefix}/${filename}`,
    };
  }

  async deleteFile(objectKey: string): Promise<void> {
    try {
      const fullPath = path.join(this.baseUploadDir, objectKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (e: any) {
      this.logger.warn(`Gagal menghapus file lokal: ${e?.message}`);
    }
  }

  getPublicUrl(prefix: string, filename: string): string {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${prefix}/${filename}`;
  }
}
