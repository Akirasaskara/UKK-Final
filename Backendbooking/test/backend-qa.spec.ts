import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { calculateEndTime, generateBookingCode, generateTicketNumber, getJakartaDateString } from '../src/common/utils/time.util.js';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Backend Automated QA & Security Test Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Security & Password Hashing QA', () => {
    it('should hash password with Argon2 securely and verify match', async () => {
      const password = 'SuperSecretPassword123!';
      const hash = await argon2.hash(password);
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$argon2')).toBe(true);

      const isMatch = await argon2.verify(hash, password);
      expect(isMatch).toBe(true);

      const isMismatch = await argon2.verify(hash, 'WrongPassword');
      expect(isMismatch).toBe(false);
    });
  });

  describe('2. Time & Pricing Utilities QA', () => {
    it('should calculate end time correctly for standard durations', () => {
      expect(calculateEndTime('09:00', 3)).toBe('12:00');
      expect(calculateEndTime('13:30', 2)).toBe('15:30');
      expect(calculateEndTime('08:15', 1)).toBe('09:15');
    });

    it('should reject reservations that cross the daily boundary', () => {
      expect(calculateEndTime('21:00', 3)).toBe('24:00');
      expect(() => calculateEndTime('22:00', 3)).toThrow('melewati batas operasional');
      expect(() => calculateEndTime('23:30', 1)).toThrow('melewati batas operasional');
    });

    it('should resolve the business date in Asia/Jakarta', () => {
      expect(getJakartaDateString(new Date('2026-09-30T18:00:00.000Z'))).toBe('2026-10-01');
    });

    it('should generate valid format booking codes', () => {
      const code = generateBookingCode('2026-09-30');
      expect(code.startsWith('BOOK-20260930-')).toBe(true);
      expect(code.length).toBeGreaterThan(15);
    });

    it('should generate valid format ticket numbers', () => {
      const ticket = generateTicketNumber('2026-09-30', 12);
      expect(ticket).toBe('TICKET-MOKLET-20260930-0012');
    });
  });

  describe('3. Database Connectivity & Schema Invariants', () => {
    it('should connect to MySQL and execute query', async () => {
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe('number');
    });
  });
});
