import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL wajib diisi');

const adapter = new PrismaMariaDb(databaseUrl.replace('mysql://', 'mariadb://') as never);
const prisma = new PrismaClient({ adapter });
const storageDriver = process.env.STORAGE_DRIVER || 'local';
const batchSize = Math.min(Math.max(Number(process.env.MEDIA_CLEANUP_BATCH_SIZE || 100), 1), 500);

async function deleteObject(objectKey: string) {
  if (storageDriver === 's3') {
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) throw new Error('S3_BUCKET_NAME wajib diisi untuk cleanup S3');
    const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    return;
  }

  const baseDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
  const fullPath = path.resolve(baseDir, objectKey);
  if (!fullPath.startsWith(`${baseDir}${path.sep}`)) {
    throw new Error('Object key berada di luar direktori upload');
  }
  await fs.promises.rm(fullPath, { force: true });
}

async function run() {
  const expired = await prisma.mediaUpload.findMany({
    where: {
      status: 'staged',
      expiresAt: { lt: new Date() },
      deletedAt: null,
    },
    orderBy: { id: 'asc' },
    take: batchSize,
  });

  let deleted = 0;
  let failed = 0;
  for (const media of expired) {
    try {
      await deleteObject(media.objectKey);
      await prisma.mediaUpload.update({
        where: { id: media.id },
        data: { status: 'deleted', deletedAt: new Date() },
      });
      deleted += 1;
    } catch (error: unknown) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'unknown cleanup error';
      console.error(`Media cleanup failed for ledger id ${media.id.toString()}: ${message}`);
    }
  }

  console.log(`Media cleanup complete: selected=${expired.length}, deleted=${deleted}, failed=${failed}`);
}

run()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
