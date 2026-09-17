import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';

async function testAppStart() {
  console.log('Starting app...');
  const app = await NestFactory.create(AppModule);
  console.log('App created!');
  await app.listen(3002);
  console.log('App listening on port 3002!');
  await app.close();
  console.log('App closed successfully!');
}

testAppStart().catch(console.error);
