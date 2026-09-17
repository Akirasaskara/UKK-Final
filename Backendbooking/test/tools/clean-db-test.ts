import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

const url = process.env.DATABASE_URL!.replace('mysql://', 'mariadb://');
const pool = mariadb.createPool(url);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function clean() {
  console.log('Testing delete operations with pool...');
  const users = await prisma.user.findMany();
  console.log('Users found:', users);
  console.log('Cleaned successfully!');
}

clean()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
