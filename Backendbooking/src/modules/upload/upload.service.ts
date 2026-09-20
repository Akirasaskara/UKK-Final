import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import sharp from 'sharp';
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

  private async validateFile(file: UploadedFileDto) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File gambar wajib diunggah');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format berkas tidak didukung. Hanya .jpg, .jpeg, .png, dan .webp yang diizinkan.',
      );
    }

    const maxBytes = Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024);
    if (file.size < 1 || file.size > maxBytes) {
      throw new BadRequestException('Ukuran berkas maksimal 5MB');
    }

    try {
      const metadata = await sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 25_000_000,
      }).metadata();
      const expectedFormat = file.mimetype === 'image/jpeg'
        ? 'jpeg'
        : file.mimetype === 'image/png'
          ? 'png'
          : 'webp';

      if (metadata.format !== expectedFormat || !metadata.width || !metadata.height) {
        throw new Error('Image format mismatch');
      }
      if (metadata.width > 6000 || metadata.height > 6000) {
        throw new Error('Image dimensions exceed allowed bounds');
      }
    } catch {
      throw new BadRequestException(
        'Berkas gambar rusak, tidak lengkap, atau dimensinya melebihi batas yang diizinkan.',
      );
    }
  }

  async uploadGeneral(file: UploadedFileDto, user: any) {
    await this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const { objectKey, url } = await this.storage.uploadFile(
      'general',
      filename,
      file.buffer,
      file.mimetype,
    );

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
          objectKey,
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
        object_key: objectKey,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url,
      },
    };
  }

  async uploadSpace(file: UploadedFileDto, user: any) {
    await this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const { objectKey, url } = await this.storage.uploadFile(
      'spaces',
      filename,
      file.buffer,
      file.mimetype,
    );

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
          objectKey,
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
        object_key: objectKey,
        url,
      },
    };
  }

  async uploadMember(file: UploadedFileDto, user: any) {
    await this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const { objectKey, url } = await this.storage.uploadFile(
      'members',
      filename,
      file.buffer,
      file.mimetype,
    );

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
          purpose: 'member_photo',
          objectKey,
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
        object_key: objectKey,
        url,
      },
    };
  }
}
