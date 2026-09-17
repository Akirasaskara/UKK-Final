import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

async function main() {
  const url = process.env.DATABASE_URL!.replace('mysql://', 'mariadb://');
  const adapter = new PrismaMariaDb(url as any);
  const prisma = new PrismaClient({ adapter }) as any;

  console.log('Model delegate keys on PrismaClient:');
  console.log(
    Object.keys(prisma).filter((k) => !k.startsWith('$') && !k.startsWith('_')),
  );
  await prisma.$disconnect();
}

void main().catch(console.error);
