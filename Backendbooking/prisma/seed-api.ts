import 'dotenv/config';

// 1. Tentukan URL Target Backend API
const API_BASE_URL = process.env.API_BASE_URL || process.env.BACKEND_API_URL || 'https://api.fallingforyou.my.id';
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'MokletSuperSecret123!';

console.log(`\n======================================================`);
console.log(`🚀 MEMULAI SEEDING VIA HTTP REST API`);
console.log(`🌐 Target Server: ${API_BASE_URL}`);
console.log(`======================================================\n`);

async function apiRequest(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    console.error(`❌ Gagal terhubung ke ${url}: ${err.message}`);
    throw err;
  }
}

async function runApiSeeder() {
  // A. Health Check Target Server
  console.log('1. Memeriksa status kesehatan server backend...');
  const health = await apiRequest('/health', { method: 'GET' });
  if (!health.ok) {
    console.error(`❌ Server backend tidak dapat diakses (HTTP ${health.status}). Pastikan server menyala.`);
    process.exit(1);
  }
  console.log('   ✅ Server live & online.\n');

  // B. Registrasi / Login Admin Space
  console.log('2. Registrasi / Login Admin Space...');
  
  // 1. Admin Nusa Workhub Malang
  let nusaToken = '';
  const regNusa = await apiRequest('/api/auth/register/admin-space', {
    method: 'POST',
    body: JSON.stringify({
      username: 'seed_admin_nusa',
      password: DEFAULT_PASSWORD,
      nama_coworking: 'Nusa Workhub Malang',
      nama_pemilik: 'Raka Pradana, S.T.',
      telp: '0341-700100',
      alamat: 'Jl. Soekarno Hatta No. 45, Lowokwaru, Kota Malang',
      deskripsi_fasilitas: 'Fiber WiFi 150Mbps, Standing Desk, Meeting Room TV 65 Inch, Musholla, Free Coffee.',
    }),
  });

  if (regNusa.ok) {
    nusaToken = regNusa.data.data.access_token;
    console.log('   ✅ Admin Nusa Workhub: Registrasi berhasil.');
  } else {
    // Jika sudah terdaftar, lakukan Login
    const loginNusa = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'seed_admin_nusa', password: DEFAULT_PASSWORD }),
    });
    if (loginNusa.ok) {
      nusaToken = loginNusa.data.data.access_token;
      console.log('   ✅ Admin Nusa Workhub: Login berhasil.');
    } else {
      console.error('   ❌ Gagal login Admin Nusa:', loginNusa.data?.message);
    }
  }

  // 2. Admin Arunika Coworking Batu
  let arunikaToken = '';
  const regArunika = await apiRequest('/api/auth/register/admin-space', {
    method: 'POST',
    body: JSON.stringify({
      username: 'seed_admin_arunika',
      password: DEFAULT_PASSWORD,
      nama_coworking: 'Arunika Coworking Batu',
      nama_pemilik: 'Maya Lestari, M.M.',
      telp: '0341-700200',
      alamat: 'Jl. Diponegoro No. 88, Sisir, Kota Batu',
      deskripsi_fasilitas: 'Mountain View, WiFi 200Mbps, AC Inverter, Smart TV 55 Inch, Whiteboard Kaca.',
    }),
  });

  if (regArunika.ok) {
    arunikaToken = regArunika.data.data.access_token;
    console.log('   ✅ Admin Arunika Batu: Registrasi berhasil.');
  } else {
    const loginArunika = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'seed_admin_arunika', password: DEFAULT_PASSWORD }),
    });
    if (loginArunika.ok) {
      arunikaToken = loginArunika.data.data.access_token;
      console.log('   ✅ Admin Arunika Batu: Login berhasil.');
    }
  }

  // C. Tambah Inventaris Workspaces
  console.log('\n3. Menambahkan Inventaris Workspaces (Admin Token)...');
  const spaceIdMap: Record<string, number> = {};

  const spacesNusa = [
    { nama_space: 'Focus Desk A1', harga_per_jam: 25000, tipe: 'desk', kapasitas: 1, deskripsi: 'Meja ergonomis, stopkontak ganda, WiFi 100Mbps.' },
    { nama_space: 'Window Desk A2', harga_per_jam: 30000, tipe: 'desk', kapasitas: 1, deskripsi: 'Meja santai dekat jendela dengan monitor 24 inch.' },
    { nama_space: 'Meeting Room Semeru', harga_per_jam: 120000, tipe: 'meeting_room', kapasitas: 8, deskripsi: 'Ruang rapat TV 65 Inch 4K, glass whiteboard, AC dingin.' },
    { nama_space: 'Meeting Room Bromo', harga_per_jam: 85000, tipe: 'meeting_room', kapasitas: 5, deskripsi: 'Ruang diskusi 5 orang dengan display 43 inch.' },
    { nama_space: 'Private Office Arjuno', harga_per_jam: 175000, tipe: 'private_office', kapasitas: 6, deskripsi: 'Kantor privat tim 6 orang dengan smart access card.' },
    { nama_space: 'Private Office Kawi', harga_per_jam: 145000, tipe: 'private_office', kapasitas: 4, deskripsi: 'Ruang kantor privat ber-AC untuk 4 orang.' },
  ];

  if (nusaToken) {
    for (const sp of spacesNusa) {
      const res = await apiRequest('/api/admin/spaces', {
        method: 'POST',
        headers: { Authorization: `Bearer ${nusaToken}` },
        body: JSON.stringify(sp),
      });
      if (res.ok) {
        spaceIdMap[sp.nama_space] = res.data.data.id;
        console.log(`   ✅ Nusa Space: ${sp.nama_space} (ID: ${res.data.data.id})`);
      } else {
        console.log(`   ℹ️ Nusa Space (${sp.nama_space}): ${res.data?.message || 'Sudah ada'}`);
      }
    }
  }

  const spacesArunika = [
    { nama_space: 'Garden Desk B1', harga_per_jam: 28000, tipe: 'desk', kapasitas: 1, deskripsi: 'Workstation dekat vertical garden udara segar.' },
    { nama_space: 'Panorama Desk B2', harga_per_jam: 32000, tipe: 'desk', kapasitas: 1, deskripsi: 'Meja kerja view pegunungan Kota Batu.' },
    { nama_space: 'Meeting Room Panderman', harga_per_jam: 135000, tipe: 'meeting_room', kapasitas: 10, deskripsi: 'Ruang rapat proyektor laser 4000 lumens, mic wireless.' },
    { nama_space: 'Private Office Welirang', harga_per_jam: 190000, tipe: 'private_office', kapasitas: 8, deskripsi: 'Kantor privat enterprise 8 orang dengan printer scanner.' },
  ];

  if (arunikaToken) {
    for (const sp of spacesArunika) {
      const res = await apiRequest('/api/admin/spaces', {
        method: 'POST',
        headers: { Authorization: `Bearer ${arunikaToken}` },
        body: JSON.stringify(sp),
      });
      if (res.ok) {
        spaceIdMap[sp.nama_space] = res.data.data.id;
        console.log(`   ✅ Arunika Space: ${sp.nama_space} (ID: ${res.data.data.id})`);
      }
    }
  }

  // D. Tambah Kupon Diskon Promo
  console.log('\n4. Menambahkan Kupon Promosi Diskon...');
  const now = new Date();
  const tglAwal = new Date(now.getTime() - 15 * 86400000).toISOString();
  const tglAkhir = new Date(now.getTime() + 45 * 86400000).toISOString();

  if (nusaToken) {
    const promos = [
      { nama_diskon: 'HEMAT10', persentase_diskon: 10, tanggal_awal: tglAwal, tanggal_akhir: tglAkhir },
      { nama_diskon: 'MAHASISWA15', persentase_diskon: 15, tanggal_awal: tglAwal, tanggal_akhir: tglAkhir },
    ];
    for (const p of promos) {
      const res = await apiRequest('/api/admin/diskon', {
        method: 'POST',
        headers: { Authorization: `Bearer ${nusaToken}` },
        body: JSON.stringify(p),
      });
      if (res.ok) console.log(`   ✅ Kupon Promo Nusa: ${p.nama_diskon} (${p.persentase_diskon}%)`);
    }
  }

  // E. Registrasi Member Global
  console.log('\n5. Registrasi Member Global...');
  const memberTokens: Record<string, string> = {};
  const members = [
    { username: 'seed_member_andi', nama_member: 'Andi Saputra', instansi: 'Universitas Brawijaya', alamat: 'Jl. Veteran No. 12 Malang', telp: '081234567801' },
    { username: 'seed_member_sari', nama_member: 'Sari Puspita', instansi: 'PT Nusantara Digital Studio', alamat: 'Jl. Danau Toba No. 24 Malang', telp: '081234567802' },
    { username: 'seed_member_bima', nama_member: 'Bima Adinata', instansi: 'Politeknik Negeri Malang', alamat: 'Jl. Kalpataru No. 55 Malang', telp: '081234567803' },
    { username: 'seed_member_dewi', nama_member: 'Dewi Anggraini', instansi: 'Studio Kreasi Mandiri', alamat: 'Jl. Panglima Sudirman Batu', telp: '081234567804' },
    { username: 'seed_member_assisted', nama_member: 'Rani Maheswari', instansi: 'Wirausaha Muda Malang', alamat: 'Jl. MT Haryono No. 77 Malang', telp: '081234567805' },
  ];

  for (const m of members) {
    const res = await apiRequest('/api/auth/register/member', {
      method: 'POST',
      body: JSON.stringify({ ...m, password: DEFAULT_PASSWORD }),
    });
    if (res.ok) {
      memberTokens[m.username] = res.data.data.access_token;
      console.log(`   ✅ Member: ${m.nama_member} (@${m.username}) terdaftar.`);
    } else {
      const login = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: m.username, password: DEFAULT_PASSWORD }),
      });
      if (login.ok) {
        memberTokens[m.username] = login.data.data.access_token;
        console.log(`   ✅ Member: ${m.nama_member} (@${m.username}) login.`);
      }
    }
  }

  // F. Pembuatan Reservasi Transaksi
  console.log('\n6. Membuat Transaksi Reservasi & Simulasi Alur...');
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

  // Cari space ID dari katalog publik
  const publicSpaces = await apiRequest('/api/spaces', { method: 'GET' });
  const allSpaces = Array.isArray(publicSpaces.data?.data) ? publicSpaces.data.data : [];
  const focusDesk = allSpaces.find((s: any) => s.nama_space === 'Focus Desk A1');
  const semeruRoom = allSpaces.find((s: any) => s.nama_space === 'Meeting Room Semeru');

  if (focusDesk && memberTokens['seed_member_andi']) {
    // 1. Booking Hari Ini (Aktif)
    const b1 = await apiRequest('/api/reservasi', {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberTokens['seed_member_andi']}` },
      body: JSON.stringify({
        id_space: focusDesk.id,
        tanggal_reservasi: todayStr,
        jam_mulai: '09:00',
        durasi_jam: 4,
        kode_promo: 'HEMAT10',
      }),
    });

    if (b1.ok && nusaToken) {
      const bookingId = b1.data.data.id;
      console.log(`   ✅ Booking Dibuat: ${b1.data.data.kode_booking} (ID: ${bookingId})`);
      
      // Approve oleh Admin
      await apiRequest(`/api/admin/reservasi/${bookingId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${nusaToken}` },
        body: JSON.stringify({ status: 'disetujui' }),
      });
      console.log(`      ↳ Disetujui oleh Admin Nusa.`);

      // Check-In oleh Admin
      await apiRequest(`/api/admin/reservasi/${bookingId}/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${nusaToken}` },
      });
      console.log(`      ↳ Check-In berhasil (Status sekarang: AKTIF).`);
    }
  }

  if (semeruRoom && memberTokens['seed_member_sari']) {
    // 2. Booking Besok (Disetujui)
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(tomorrow);

    const b2 = await apiRequest('/api/reservasi', {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberTokens['seed_member_sari']}` },
      body: JSON.stringify({
        id_space: semeruRoom.id,
        tanggal_reservasi: tomorrowStr,
        jam_mulai: '13:00',
        durasi_jam: 2,
        kode_promo: 'MAHASISWA15',
      }),
    });

    if (b2.ok && nusaToken) {
      const bookingId = b2.data.data.id;
      console.log(`   ✅ Booking Dibuat: ${b2.data.data.kode_booking} (ID: ${bookingId})`);
      await apiRequest(`/api/admin/reservasi/${bookingId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${nusaToken}` },
        body: JSON.stringify({ status: 'disetujui' }),
      });
      console.log(`      ↳ Disetujui oleh Admin Nusa (Siap untuk Scan QR).`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 SEEDING VIA HTTP REST API SELESAI DENGAN SUKSES!`);
  console.log(`======================================================\n`);
}

runApiSeeder().catch(console.error);