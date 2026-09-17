# Smart Space Booking

Monorepo aplikasi reservasi coworking space dan workstation.

## Struktur

```text
Backendbooking/   NestJS, TypeScript, Prisma ORM, MySQL
Frontendbooking/  Next.js App Router, React, TypeScript, Tailwind CSS
```

## Backend

```bash
cd Backendbooking
npm install
cp .env.example .env
npx prisma generate
npm run start:dev
```

API lokal berjalan pada `http://localhost:3000`.

Swagger tersedia pada `http://localhost:3000/docs`.

Dokumentasi backend tersedia di `Backendbooking/docs`.

## Frontend

```bash
cd Frontendbooking
npm install
npm run dev
```

Frontend lokal berjalan pada `http://localhost:3000` secara default. Gunakan port berbeda ketika backend juga berjalan lokal.

Dokumentasi frontend tersedia di `Frontendbooking/docs`.

## Verifikasi Backend

```bash
cd Backendbooking
npm run lint
npm run build
npm test
npm run test:e2e
npx prisma validate
npx prisma generate
```

## Environment

Jangan commit file `.env`, credential database, JWT secret, AWS credential, atau sertifikat privat. Gunakan `.env.example` sebagai referensi nama variabel.
