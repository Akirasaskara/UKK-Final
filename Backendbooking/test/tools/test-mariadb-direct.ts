import 'dotenv/config';
import mariadb from 'mariadb';

async function testPool() {
  const url = process.env.DATABASE_URL!.replace('mysql://', 'mariadb://');
  console.log('Connecting via mariadb pool to:', url);
  const pool = mariadb.createPool(url);
  const conn = await pool.getConnection();
  console.log('Connected!');
  const res = await conn.query('SHOW TABLES;');
  console.log('Tables:', res);
  await conn.release();
  await pool.end();
}

void testPool().catch(console.error);
