import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from './storage.interface.js';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;
  private readonly s3Client: S3Client;

  constructor(@Optional() configService?: ConfigService) {
    const region = configService?.get<string>('AWS_REGION') || process.env.AWS_REGION || 'us-east-1';
    this.bucketName = configService?.get<string>('S3_BUCKET_NAME') || process.env.S3_BUCKET_NAME || '';
    this.publicBaseUrl = configService?.get<string>('S3_PUBLIC_BASE_URL') || process.env.S3_PUBLIC_BASE_URL || '';
    this.s3Client = new S3Client({ region });
  }

  async uploadFile(
    prefix: string,
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ filename: string; url: string }> {
    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required when STORAGE_DRIVER=s3');
    }

    const key = `${prefix}/${filename}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );

    return {
      filename,
      url: this.getPublicUrl(prefix, filename),
    };
  }

  async deleteFile(objectKey: string): Promise<void> {
    if (!this.bucketName) {
      return;
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      }),
    );
  }

  getPublicUrl(prefix: string, filename: string): string {
    const key = `${prefix}/${filename}`;
    return this.publicBaseUrl
      ? `${this.publicBaseUrl}/${key}`
      : `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
