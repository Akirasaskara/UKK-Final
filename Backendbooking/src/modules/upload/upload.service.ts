import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service.js';
import { STORAGE_SERVICE } from '../../infrastructure/storage/storage.module.js';
import type { StorageService } from '../../infrastructure/storage/storage.interface.js';

export interface UploadedFileDto {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private storage: StorageService,
  ) {}

  private validateFile(file: UploadedFileDto) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File gambar wajib diunggah');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format berkas tidak didukung. Hanya .jpg, .jpeg, .png, dan .webp yang diizinkan.',
      );
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('Ukuran berkas maksimal 5MB');
    }

    // Magic Bytes Verification
    const buffer = file.buffer;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString('utf8', 0, 4) === 'RIFF' &&
      buffer.toString('utf8', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      throw new BadRequestException('Format binary file gambar tidak valid');
    }
  }

  async uploadGeneral(file: UploadedFileDto, user: any) {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const { url } = await this.storage.uploadFile('general', filename, file.buffer, file.mimetype);

    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await this.prisma.mediaUpload.create({
        data: {
          uploaderUserId: user.id,
          purpose: 'general',
          objectKey: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          checksumSha256: checksum,
          status: 'staged',
          expiresAt,
        },
      });
    } catch (dbErr) {
      await this.storage.deleteFile(`general/${filename}`);
      throw dbErr;
    }

    return {
      message: 'File berhasil diupload',
      data: {
        filename,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url,
      },
    };
  }

  async uploadSpace(file: UploadedFileDto, user: any) {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const { url } = await this.storage.uploadFile('spaces', filename, file.buffer, file.mimetype);

    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await this.prisma.mediaUpload.create({
        data: {
          uploaderUserId: user.id,
          ownerId: user.spaceOwner?.id || null,
          purpose: 'space_photo',
          objectKey: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          checksumSha256: checksum,
          status: 'staged',
          expiresAt,
        },
      });
    } catch (dbErr) {
      await this.storage.deleteFile(`spaces/${filename}`);
      throw dbErr;
    }

    return {
      message: 'Foto space berhasil diupload',
      data: {
        filename,
        url,
      },
    };
  }

  async uploadMember(file: UploadedFileDto, user: any) {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const { url } = await this.storage.uploadFile('members', filename, file.buffer, file.mimetype);

    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await this.prisma.mediaUpload.create({
        data: {
          uploaderUserId: user.id,
          purpose: 'member_photo',
          objectKey: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          checksumSha256: checksum,
          status: 'staged',
          expiresAt,
        },
      });
    } catch (dbErr) {
      await this.storage.deleteFile(`members/${filename}`);
      throw dbErr;
    }

    return {
      message: 'Foto member berhasil diupload',
      data: {
        filename,
        url,
      },
    };
  }
}
