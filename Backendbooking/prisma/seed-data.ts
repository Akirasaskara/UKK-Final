import {
  addDays,
  formatDateString,
  parseTimeOnlyUtc,
  createDateTimeUtc,
  calculateDiscountSnapshot,
  createSha256Hash,
} from './seed-helpers.js';

export interface SeedSpaceDef {
  namaSpace: string;
  hargaPerJam: bigint;
  tipe: 'desk' | 'meeting_room' | 'private_office';
  kapasitas: number;
  deskripsi: string;
  foto: string | null;
  archivedOffsetDays?: number;
}

export interface SeedDiscountDef {
  namaDiskon: string;
  persentaseDiskon: number;
  startOffsetDays: number;
  endOffsetDays: number;
}

export interface SeedReservationDef {
  kodeBooking: string;
  ownerKey: 'nusa' | 'arunika';
  memberUsername: string;
  spaceName: string;
  discountCode?: string;
  dayOffset: number;
  jamMulai: string;
  durasiJam: number;
  jamSelesai: string;
  status: 'belum_dikonfirm' | 'disetujui' | 'aktif' | 'selesai' | 'dibatalkan';
  checkInTimeStr?: string;
  checkOutTimeStr?: string;
}

export function getSeedData(referenceDate: Date) {
  const refDateStr = formatDateString(referenceDate);

  // 1. Owners & Admin Users
  const owners = [
    {
      key: 'nusa',
      user: {
        username: 'seed_admin_nusa',
        role: 'admin_space',
      },
      owner: {
        namaCoworking: 'Nusa Workhub Malang',
        namaPemilik: 'Raka Pradana, S.T.',
        telp: '0341-700100',
        alamat: 'Jl. Soekarno Hatta No. 45, Lowokwaru, Kota Malang, Jawa Timur 65141',
        deskripsiFasilitas:
          'High-Speed Fiber WiFi 150Mbps, Standing Desk Elektrik, Monitor 24 & 27 Inch, Focus Pods, Free Flow Kopi Espresso & Teh Artisan, Musholla, Podcast Room, Parkir Luas.',
      },
    },
    {
      key: 'arunika',
      user: {
        username: 'seed_admin_arunika',
        role: 'admin_space',
      },
      owner: {
        namaCoworking: 'Arunika Coworking Batu',
        namaPemilik: 'Maya Lestari, M.M.',
        telp: '0341-700200',
        alamat: 'Jl. Diponegoro No. 88, Sisir, Kota Batu, Jawa Timur 65314',
        deskripsiFasilitas:
          'Mountain View Workstation, Ultra-Fast WiFi 200Mbps, AC Inverter, Smart TV 55 Inch untuk Meeting, Whiteboard Kaca, Pantry Lengkap, Outdoor Lounge, Shower Room.',
      },
    },
  ];

  // 2. Members (Global Accounts)
  const members = [
    {
      username: 'seed_member_andi',
      namaMember: 'Andi Saputra',
      instansi: 'Universitas Brawijaya',
      alamat: 'Jl. Veteran No. 12, Klojen, Kota Malang',
      telp: '081234567801',
      foto: null,
    },
    {
      username: 'seed_member_sari',
      namaMember: 'Sari Puspita',
      instansi: 'PT Nusantara Digital Studio',
      alamat: 'Jl. Danau Toba No. 24, Sawojajar, Kota Malang',
      telp: '081234567802',
      foto: null,
    },
    {
      username: 'seed_member_bima',
      namaMember: 'Bima Adinata',
      instansi: 'Politeknik Negeri Malang',
      alamat: 'Jl. Kalpataru No. 55, Lowokwaru, Kota Malang',
      telp: '081234567803',
      foto: null,
    },
    {
      username: 'seed_member_dewi',
      namaMember: 'Dewi Anggraini',
      instansi: 'Studio Kreasi Mandiri',
      alamat: 'Jl. Panglima Sudirman No. 101, Kota Batu',
      telp: '081234567804',
      foto: null,
    },
    {
      username: 'seed_member_assisted',
      namaMember: 'Rani Maheswari',
      instansi: 'Komunitas Wirausaha Muda Malang',
      alamat: 'Jl. MT Haryono No. 77, Dinoyo, Kota Malang',
      telp: '081234567805',
      foto: null,
    },
  ];

  // 3. Spaces (Workstations, Meeting Rooms, Private Offices)
  const nusaSpaces: SeedSpaceDef[] = [
    {
      namaSpace: 'Focus Desk A1',
      hargaPerJam: 25000n,
      tipe: 'desk',
      kapasitas: 1,
      deskripsi:
        'Meja kerja individual ergonomis dengan kursi Herman Miller style, stopkontak universal ganda, lampu baca LED, dan koneksi internet kabel LAN Gigabit.',
      foto: null,
    },
    {
      namaSpace: 'Window Desk A2',
      hargaPerJam: 30000n,
      tipe: 'desk',
      kapasitas: 1,
      deskripsi:
        'Meja kerja santai menghadap jendela dengan pencahayaan alami maksimal, colokan fast-charging type-C, dan monitor eksternal 24 inch Full HD.',
      foto: null,
    },
    {
      namaSpace: 'Meeting Room Semeru',
      hargaPerJam: 120000n,
      tipe: 'meeting_room',
      kapasitas: 8,
      deskripsi:
        'Ruang rapat kedap suara untuk 8 orang, dilengkapi TV 65 Inch 4K dengan wireless presentation dongle, glass whiteboard besar, conference camera, dan AC dingin.',
      foto: null,
    },
    {
      namaSpace: 'Meeting Room Bromo',
      hargaPerJam: 85000n,
      tipe: 'meeting_room',
      kapasitas: 5,
      deskripsi:
        'Ruang diskusi tim kecil (4-5 orang) dengan suasana cozy, display monitor 43 inch, whiteboard magnetik, dan soundbar bluetooth.',
      foto: null,
    },
    {
      namaSpace: 'Private Office Arjuno',
      hargaPerJam: 175000n,
      tipe: 'private_office',
      kapasitas: 6,
      deskripsi:
        'Ruang kantor privat ber-AC khusus tim 6 orang dengan pintu akses kartu pintar mandiri, laci berkas berpengunci, dan meja meeting internal.',
      foto: null,
    },
    {
      namaSpace: 'Private Office Kawi',
      hargaPerJam: 145000n,
      tipe: 'private_office',
      kapasitas: 4,
      deskripsi:
        'Ruang kerja privat untuk 4 orang profesional dengan partisi kaca frosted, router WiFi dedicated, dan sofa istirahat tim.',
      foto: null,
    },
    {
      namaSpace: 'Legacy Desk N1 (Nonaktif)',
      hargaPerJam: 20000n,
      tipe: 'desk',
      kapasitas: 1,
      deskripsi: 'Meja kerja inventaris lama yang telah diarsipkan dari katalog publik.',
      foto: null,
      archivedOffsetDays: -30,
    },
  ];

  const arunikaSpaces: SeedSpaceDef[] = [
    {
      namaSpace: 'Garden Desk B1',
      hargaPerJam: 28000n,
      tipe: 'desk',
      kapasitas: 1,
      deskripsi:
        'Workstation dekat vertical garden dengan sirkulasi udara segar, colokan listrik ground, dan meja kayu jati minimalis.',
      foto: null,
    },
    {
      namaSpace: 'Panorama Desk B2',
      hargaPerJam: 32000n,
      tipe: 'desk',
      kapasitas: 1,
      deskripsi:
        'Meja kerja premium lantai 2 dengan pemandangan pegunungan Kota Batu, standing desk mekanik, dan kursi mesh ergonomis.',
      foto: null,
    },
    {
      namaSpace: 'Meeting Room Panderman',
      hargaPerJam: 135000n,
      tipe: 'meeting_room',
      kapasitas: 10,
      deskripsi:
        'Ruang rapat representatif kapasitas 10 orang dengan proyektor laser 4000 lumens, microphone podium wireless, dan AC dual inverter.',
      foto: null,
    },
    {
      namaSpace: 'Private Office Welirang',
      hargaPerJam: 190000n,
      tipe: 'private_office',
      kapasitas: 8,
      deskripsi:
        'Kantor privat enterprise untuk tim 8 orang dengan interior modern industrial, brankas dokumen, dan fasilitas printer scanner internal.',
      foto: null,
    },
  ];

  // 4. Discounts (Relative to reference date)
  const nusaDiscounts: SeedDiscountDef[] = [
    {
      namaDiskon: 'HEMAT10',
      persentaseDiskon: 10,
      startOffsetDays: -30,
      endOffsetDays: 30, // Active
    },
    {
      namaDiskon: 'MAHASISWA15',
      persentaseDiskon: 15,
      startOffsetDays: -15,
      endOffsetDays: 45, // Active
    },
    {
      namaDiskon: 'AKHIRPEKAN20',
      persentaseDiskon: 20,
      startOffsetDays: 7,
      endOffsetDays: 37, // Upcoming
    },
    {
      namaDiskon: 'PROMOLAMA5',
      persentaseDiskon: 5,
      startOffsetDays: -60,
      endOffsetDays: -31, // Expired
    },
    {
      namaDiskon: 'GRATIS100',
      persentaseDiskon: 100,
      startOffsetDays: -5,
      endOffsetDays: 25, // Active Boundary (100% discount)
    },
  ];

  const arunikaDiscounts: SeedDiscountDef[] = [
    {
      namaDiskon: 'BATU10',
      persentaseDiskon: 10,
      startOffsetDays: -20,
      endOffsetDays: 40, // Active
    },
    {
      namaDiskon: 'TIMKERJA20',
      persentaseDiskon: 20,
      startOffsetDays: -10,
      endOffsetDays: 50, // Active
    },
    {
      namaDiskon: 'LIBURAN15',
      persentaseDiskon: 15,
      startOffsetDays: 10,
      endOffsetDays: 40, // Upcoming
    },
    {
      namaDiskon: 'EXPIREDBATU5',
      persentaseDiskon: 5,
      startOffsetDays: -45,
      endOffsetDays: -15, // Expired
    },
  ];

  // 5. Reservations Matrix (Covering all 5 states, adjacent intervals, snapshots, and reports)
  const reservations: SeedReservationDef[] = [
    // Owner A - Nusa Workhub
    {
      kodeBooking: `SEED-NUSA-AKTIF-001`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_andi',
      spaceName: 'Focus Desk A1',
      discountCode: 'HEMAT10',
      dayOffset: 0, // Today
      jamMulai: '09:00',
      durasiJam: 4,
      jamSelesai: '13:00',
      status: 'aktif',
      checkInTimeStr: '08:58:12',
    },
    {
      // Adjacent reservation on the same space (13:00-16:00)
      kodeBooking: `SEED-NUSA-APPROVED-002`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_andi',
      spaceName: 'Focus Desk A1',
      dayOffset: 0, // Today
      jamMulai: '13:00',
      durasiJam: 3,
      jamSelesai: '16:00',
      status: 'disetujui',
    },
    {
      kodeBooking: `SEED-NUSA-PENDING-003`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_sari',
      spaceName: 'Meeting Room Semeru',
      discountCode: 'MAHASISWA15',
      dayOffset: 1, // Tomorrow
      jamMulai: '10:00',
      durasiJam: 2,
      jamSelesai: '12:00',
      status: 'belum_dikonfirm',
    },
    {
      kodeBooking: `SEED-NUSA-APPROVED-004`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_dewi',
      spaceName: 'Window Desk A2',
      dayOffset: 2, // In 2 days
      jamMulai: '14:00',
      durasiJam: 4,
      jamSelesai: '18:00',
      status: 'disetujui',
    },
    {
      kodeBooking: `SEED-NUSA-CANCELLED-005`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_sari',
      spaceName: 'Meeting Room Bromo',
      dayOffset: -3, // 3 days ago
      jamMulai: '13:00',
      durasiJam: 2,
      jamSelesai: '15:00',
      status: 'dibatalkan',
    },
    {
      kodeBooking: `SEED-NUSA-COMPLETED-006`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_dewi',
      spaceName: 'Private Office Arjuno',
      discountCode: 'HEMAT10',
      dayOffset: -5, // 5 days ago
      jamMulai: '09:00',
      durasiJam: 8,
      jamSelesai: '17:00',
      status: 'selesai',
      checkInTimeStr: '08:55:00',
      checkOutTimeStr: '17:02:15',
    },
    {
      kodeBooking: `SEED-NUSA-COMPLETED-007`,
      ownerKey: 'nusa',
      memberUsername: 'seed_member_andi',
      spaceName: 'Private Office Kawi',
      dayOffset: -10, // 10 days ago
      jamMulai: '10:00',
      durasiJam: 5,
      jamSelesai: '15:00',
      status: 'selesai',
      checkInTimeStr: '09:58:30',
      checkOutTimeStr: '15:05:00',
    },

    // Owner B - Arunika Coworking Batu
    {
      kodeBooking: `SEED-ARUNIKA-APPROVED-001`,
      ownerKey: 'arunika',
      memberUsername: 'seed_member_bima',
      spaceName: 'Garden Desk B1',
      discountCode: 'BATU10',
      dayOffset: 0, // Today
      jamMulai: '10:00',
      durasiJam: 3,
      jamSelesai: '13:00',
      status: 'disetujui',
    },
    {
      kodeBooking: `SEED-ARUNIKA-COMPLETED-002`,
      ownerKey: 'arunika',
      memberUsername: 'seed_member_bima',
      spaceName: 'Meeting Room Panderman',
      discountCode: 'TIMKERJA20',
      dayOffset: -4, // 4 days ago
      jamMulai: '13:00',
      durasiJam: 4,
      jamSelesai: '17:00',
      status: 'selesai',
      checkInTimeStr: '12:54:10',
      checkOutTimeStr: '17:01:20',
    },
    {
      kodeBooking: `SEED-ARUNIKA-PENDING-003`,
      ownerKey: 'arunika',
      memberUsername: 'seed_member_dewi',
      spaceName: 'Private Office Welirang',
      dayOffset: 3, // In 3 days
      jamMulai: '09:00',
      durasiJam: 6,
      jamSelesai: '15:00',
      status: 'belum_dikonfirm',
    },
  ];

  return {
    owners,
    members,
    nusaSpaces,
    arunikaSpaces,
    nusaDiscounts,
    arunikaDiscounts,
    reservations,
  };
}
