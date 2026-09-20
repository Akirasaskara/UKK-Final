import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  getSeedReferenceDate,
  addDays,
  formatDateString,
  parseTimeOnlyUtc,
  createDateTimeUtc,
  calculateDiscountSnapshot,
  createSha256Hash,
  hashPassword,
} from './seed-helpers.js';
import { getSeedData } from './seed-data.js';

// 1. Non-Production Safety Guard
const isProduction = process.env.NODE_ENV === 'production';
const allowProdSeed = process.env.ALLOW_PRODUCTION_SEED === 'true';

if (isProduction && !allowProdSeed) {
  console.error('❌ SEED ABORTED: Seeding dilarang pada mode production demi keamanan data.');
  console.error('Gunakan environment development/test, atau set ALLOW_PRODUCTION_SEED=true jika benar-benar dimaksudkan.');
  process.exit(1);
}

// 2. Initialize Prisma Client with MariaDB Adapter
const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('❌ DATABASE_URL tidak ditemukan di environment variable.');
  process.exit(1);
}

const mariaUrl = rawDbUrl.replace('mysql://', 'mariadb://');
const adapter = new PrismaMariaDb(mariaUrl as any);
const prisma = new PrismaClient({ adapter });

const SEED_DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'MokletSuperSecret123!';
const isResetMode = process.argv.includes('--reset') || process.env.SEED_RESET === 'true';

async function runSeed() {
  const referenceDate = getSeedReferenceDate(process.env.SEED_REFERENCE_DATE);
  const refDateStr = formatDateString(referenceDate);
  console.log(`Memulai Seeder Smart Space Booking...`);
  console.log(`Reference Date: ${refDateStr} (Asia/Jakarta)`);

  // 3. Optional Safe Namespace Reset
  if (isResetMode) {
    console.log('🧹 Mode Reset Aktif: Menghapus record dengan prefix fixture seed_*...');

    // Delete in reverse foreign key order
    await prisma.reservationQr.deleteMany({
      where: {
        reservation: {
          kodeBooking: { startsWith: 'SEED-' },
        },
      },
    });

    await prisma.reservationDetail.deleteMany({
      where: {
        reservation: {
          kodeBooking: { startsWith: 'SEED-' },
        },
      },
    });

    await prisma.reservation.deleteMany({
      where: {
        kodeBooking: { startsWith: 'SEED-' },
      },
    });

    await prisma.idempotencyRequest.deleteMany({
      where: {
        user: {
          username: { startsWith: 'seed_' },
        },
      },
    });

    await prisma.mediaUpload.deleteMany({
      where: {
        uploader: {
          username: { startsWith: 'seed_' },
        },
      },
    });

    await prisma.discount.deleteMany({
      where: {
        owner: {
          user: {
            username: { startsWith: 'seed_' },
          },
        },
      },
    });

    await prisma.space.deleteMany({
      where: {
        owner: {
          user: {
            username: { startsWith: 'seed_' },
          },
        },
      },
    });

    await prisma.member.deleteMany({
      where: {
        user: {
          username: { startsWith: 'seed_' },
        },
      },
    });

    await prisma.spaceOwner.deleteMany({
      where: {
        user: {
          username: { startsWith: 'seed_' },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        username: { startsWith: 'seed_' },
      },
    });

    console.log('✅ Namespace fixture berhasil dibersihkan.');
  }

  const {
    owners: ownerDefs,
    members: memberDefs,
    nusaSpaces,
    arunikaSpaces,
    nusaDiscounts,
    arunikaDiscounts,
    reservations: resDefs,
  } = getSeedData(referenceDate);

  const passwordHash = await hashPassword(SEED_DEFAULT_PASSWORD);

  // 4. Seed Owners & Admins
  const ownerMap: Record<string, { userId: bigint; ownerId: bigint; namaCoworking: string; telp: string }> = {};

  for (const o of ownerDefs) {
    const user = await prisma.user.upsert({
      where: { username: o.user.username },
      update: { passwordHash, role: o.user.role },
      create: {
        username: o.user.username,
        passwordHash,
        role: o.user.role,
      },
    });

    const owner = await prisma.spaceOwner.upsert({
      where: { idUser: user.id },
      update: {
        namaCoworking: o.owner.namaCoworking,
        namaPemilik: o.owner.namaPemilik,
        telp: o.owner.telp,
        alamat: o.owner.alamat,
        deskripsiFasilitas: o.owner.deskripsiFasilitas,
      },
      create: {
        idUser: user.id,
        roleGuard: 'admin_space',
        namaCoworking: o.owner.namaCoworking,
        namaPemilik: o.owner.namaPemilik,
        telp: o.owner.telp,
        alamat: o.owner.alamat,
        deskripsiFasilitas: o.owner.deskripsiFasilitas,
      },
    });

    ownerMap[o.key] = {
      userId: user.id,
      ownerId: owner.id,
      namaCoworking: owner.namaCoworking,
      telp: owner.telp,
    };
  }

  // 5. Seed Members
  const memberMap: Record<string, { userId: bigint; memberId: bigint; namaMember: string; instansi: string; telp: string }> = {};

  for (const m of memberDefs) {
    const user = await prisma.user.upsert({
      where: { username: m.username },
      update: { passwordHash, role: 'member' },
      create: {
        username: m.username,
        passwordHash,
        role: 'member',
      },
    });

    const member = await prisma.member.upsert({
      where: { idUser: user.id },
      update: {
        namaMember: m.namaMember,
        instansi: m.instansi,
        alamat: m.alamat,
        telp: m.telp,
        foto: m.foto,
      },
      create: {
        idUser: user.id,
        roleGuard: 'member',
        namaMember: m.namaMember,
        instansi: m.instansi,
        alamat: m.alamat,
        telp: m.telp,
        foto: m.foto,
      },
    });

    memberMap[m.username] = {
      userId: user.id,
      memberId: member.id,
      namaMember: member.namaMember,
      instansi: member.instansi,
      telp: member.telp,
    };
  }

  // 6. Seed Spaces for Nusa Workhub
  const spaceMap: Record<string, { id: bigint; idOwner: bigint; namaSpace: string; tipe: string; hargaPerJam: bigint }> = {};

  for (const s of nusaSpaces) {
    const ownerId = ownerMap['nusa'].ownerId;
    const existing = await prisma.space.findFirst({
      where: { idOwner: ownerId, namaSpace: s.namaSpace },
    });

    const archivedAt = s.archivedOffsetDays
      ? addDays(referenceDate, s.archivedOffsetDays)
      : null;

    let space;
    if (existing) {
      space = await prisma.space.update({
        where: { id: existing.id },
        data: {
          hargaPerJam: s.hargaPerJam,
          tipe: s.tipe,
          kapasitas: s.kapasitas,
          deskripsi: s.deskripsi,
          foto: s.foto,
          archivedAt,
        },
      });
    } else {
      space = await prisma.space.create({
        data: {
          idOwner: ownerId,
          namaSpace: s.namaSpace,
          hargaPerJam: s.hargaPerJam,
          tipe: s.tipe,
          kapasitas: s.kapasitas,
          deskripsi: s.deskripsi,
          foto: s.foto,
          archivedAt,
        },
      });
    }

    spaceMap[s.namaSpace] = {
      id: space.id,
      idOwner: ownerId,
      namaSpace: space.namaSpace,
      tipe: space.tipe,
      hargaPerJam: space.hargaPerJam,
    };
  }

  // Seed Spaces for Arunika Coworking
  for (const s of arunikaSpaces) {
    const ownerId = ownerMap['arunika'].ownerId;
    const existing = await prisma.space.findFirst({
      where: { idOwner: ownerId, namaSpace: s.namaSpace },
    });

    let space;
    if (existing) {
      space = await prisma.space.update({
        where: { id: existing.id },
        data: {
          hargaPerJam: s.hargaPerJam,
          tipe: s.tipe,
          kapasitas: s.kapasitas,
          deskripsi: s.deskripsi,
          foto: s.foto,
        },
      });
    } else {
      space = await prisma.space.create({
        data: {
          idOwner: ownerId,
          namaSpace: s.namaSpace,
          hargaPerJam: s.hargaPerJam,
          tipe: s.tipe,
          kapasitas: s.kapasitas,
          deskripsi: s.deskripsi,
          foto: s.foto,
        },
      });
    }

    spaceMap[s.namaSpace] = {
      id: space.id,
      idOwner: ownerId,
      namaSpace: space.namaSpace,
      tipe: space.tipe,
      hargaPerJam: space.hargaPerJam,
    };
  }

  // 7. Seed Discounts
  const discountMap: Record<string, { id: bigint; idOwner: bigint; namaDiskon: string; persentaseDiskon: number }> = {};

  for (const d of nusaDiscounts) {
    const ownerId = ownerMap['nusa'].ownerId;
    const tanggalAwal = addDays(referenceDate, d.startOffsetDays);
    const tanggalAkhir = addDays(referenceDate, d.endOffsetDays);

    const discount = await prisma.discount.upsert({
      where: {
        idOwner_namaDiskon: {
          idOwner: ownerId,
          namaDiskon: d.namaDiskon,
        },
      },
      update: {
        persentaseDiskon: d.persentaseDiskon,
        tanggalAwal,
        tanggalAkhir,
      },
      create: {
        idOwner: ownerId,
        namaDiskon: d.namaDiskon,
        persentaseDiskon: d.persentaseDiskon,
        tanggalAwal,
        tanggalAkhir,
      },
    });

    discountMap[d.namaDiskon] = {
      id: discount.id,
      idOwner: ownerId,
      namaDiskon: discount.namaDiskon,
      persentaseDiskon: discount.persentaseDiskon,
    };
  }

  for (const d of arunikaDiscounts) {
    const ownerId = ownerMap['arunika'].ownerId;
    const tanggalAwal = addDays(referenceDate, d.startOffsetDays);
    const tanggalAkhir = addDays(referenceDate, d.endOffsetDays);

    const discount = await prisma.discount.upsert({
      where: {
        idOwner_namaDiskon: {
          idOwner: ownerId,
          namaDiskon: d.namaDiskon,
        },
      },
      update: {
        persentaseDiskon: d.persentaseDiskon,
        tanggalAwal,
        tanggalAkhir,
      },
      create: {
        idOwner: ownerId,
        namaDiskon: d.namaDiskon,
        persentaseDiskon: d.persentaseDiskon,
        tanggalAwal,
        tanggalAkhir,
      },
    });

    discountMap[d.namaDiskon] = {
      id: discount.id,
      idOwner: ownerId,
      namaDiskon: discount.namaDiskon,
      persentaseDiskon: discount.persentaseDiskon,
    };
  }

  // 8. Seed Reservations + ReservationDetail
  for (const r of resDefs) {
    const owner = ownerMap[r.ownerKey];
    const member = memberMap[r.memberUsername];
    const space = spaceMap[r.spaceName];
    const discount = r.discountCode ? discountMap[r.discountCode] : null;

    const targetDate = addDays(referenceDate, r.dayOffset);
    const targetDateStr = formatDateString(targetDate);
    const targetDateObj = new Date(`${targetDateStr}T00:00:00.000Z`);

    const jamMulai = parseTimeOnlyUtc(r.jamMulai);
    const jamSelesai = parseTimeOnlyUtc(r.jamSelesai);

    const checkInAt = r.checkInTimeStr
      ? createDateTimeUtc(targetDateStr, r.checkInTimeStr)
      : null;
    const checkOutAt = r.checkOutTimeStr
      ? createDateTimeUtc(targetDateStr, r.checkOutTimeStr)
      : null;

    const financial = calculateDiscountSnapshot(
      space.hargaPerJam,
      r.durasiJam,
      discount ? discount.persentaseDiskon : null,
    );

    const reservation = await prisma.reservation.upsert({
      where: { kodeBooking: r.kodeBooking },
      update: {
        idOwner: owner.ownerId,
        idMember: member.memberId,
        idSpace: space.id,
        tanggalReservasi: targetDateObj,
        jamMulai,
        jamSelesai,
        durasiJam: r.durasiJam,
        status: r.status,
        checkInAt,
        checkOutAt,
      },
      create: {
        idOwner: owner.ownerId,
        idMember: member.memberId,
        idSpace: space.id,
        kodeBooking: r.kodeBooking,
        tanggalReservasi: targetDateObj,
        jamMulai,
        jamSelesai,
        durasiJam: r.durasiJam,
        status: r.status,
        checkInAt,
        checkOutAt,
      },
    });

    await prisma.reservationDetail.upsert({
      where: { idReservasi: reservation.id },
      update: {
        idOwner: owner.ownerId,
        idSpace: space.id,
        idDiskon: discount ? discount.id : null,
        hargaPerJam: space.hargaPerJam,
        totalHargaAwal: financial.totalHargaAwal,
        potonganDiskon: financial.potonganDiskon,
        totalHarga: financial.totalHarga,
        persentaseDiskon: discount ? discount.persentaseDiskon : null,
        namaDiskonSnapshot: discount ? discount.namaDiskon : null,
        namaSpaceSnapshot: space.namaSpace,
        tipeSpaceSnapshot: space.tipe,
        namaCoworkingSnapshot: owner.namaCoworking,
        telpCoworkingSnapshot: owner.telp,
        namaMemberSnapshot: member.namaMember,
        instansiMemberSnapshot: member.instansi,
        telpMemberSnapshot: member.telp,
      },
      create: {
        idOwner: owner.ownerId,
        idReservasi: reservation.id,
        idSpace: space.id,
        idDiskon: discount ? discount.id : null,
        hargaPerJam: space.hargaPerJam,
        totalHargaAwal: financial.totalHargaAwal,
        potonganDiskon: financial.potonganDiskon,
        totalHarga: financial.totalHarga,
        persentaseDiskon: discount ? discount.persentaseDiskon : null,
        namaDiskonSnapshot: discount ? discount.namaDiskon : null,
        namaSpaceSnapshot: space.namaSpace,
        tipeSpaceSnapshot: space.tipe,
        namaCoworkingSnapshot: owner.namaCoworking,
        telpCoworkingSnapshot: owner.telp,
        namaMemberSnapshot: member.namaMember,
        instansiMemberSnapshot: member.instansi,
        telpMemberSnapshot: member.telp,
      },
    });

    // Seed QR record for approved and active bookings
    if (r.status === 'disetujui' || r.status === 'aktif') {
      const qrPayload = `VERIFY-RESERVASI-${reservation.id}-${reservation.kodeBooking}`;
      const tokenHash = createSha256Hash(qrPayload);
      const expiresAt = addDays(targetDate, 1);

      await prisma.reservationQr.upsert({
        where: { idReservasi: reservation.id },
        update: {
          idOwner: owner.ownerId,
          tokenHash,
          expiresAt,
          usedAt: r.status === 'aktif' ? checkInAt : null,
        },
        create: {
          idOwner: owner.ownerId,
          idReservasi: reservation.id,
          tokenHash,
          expiresAt,
          usedAt: r.status === 'aktif' ? checkInAt : null,
        },
      });
    }
  }

  // 9. Summary & Output Credentials
  console.log('\n=============================================');
  console.log('🎉 SEED DATABASE BERHASIL DISELESAIKAN!');
  console.log('=============================================');
  console.log(`✅ Space Owners & Admins : ${ownerDefs.length}`);
  console.log(`✅ Global Members        : ${memberDefs.length}`);
  console.log(`✅ Workspaces Inventory  : ${nusaSpaces.length + arunikaSpaces.length}`);
  console.log(`✅ Discounts / Promos    : ${nusaDiscounts.length + arunikaDiscounts.length}`);
  console.log(`✅ Reservations & Details: ${resDefs.length}`);
  console.log('---------------------------------------------');
  console.log('🔑 AKUN TEST & DEVELOPMENT FIXTURES:');
  console.log('Password untuk semua akun: [sesuai SEED_DEFAULT_PASSWORD]');
  console.log('\n[Admin Space]');
  console.log('1. Nusa Workhub Malang   -> Username: seed_admin_nusa');
  console.log('2. Arunika Coworking     -> Username: seed_admin_arunika');
  console.log('\n[Member Global]');
  console.log('1. Andi Saputra (UB)     -> Username: seed_member_andi');
  console.log('2. Sari Puspita (Agency) -> Username: seed_member_sari');
  console.log('3. Bima Adinata (Polinema)-> Username: seed_member_bima');
  console.log('4. Dewi Anggraini        -> Username: seed_member_dewi');
  console.log('5. Rani (Assisted Reg)   -> Username: seed_member_assisted (Belum ada reservasi)');
  console.log('=============================================\n');
}

runSeed()
  .catch((err) => {
    console.error('❌ Terjadi kesalahan saat seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
