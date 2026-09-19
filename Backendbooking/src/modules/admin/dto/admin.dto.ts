import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCoworkingProfileDto {
  @ApiProperty({ example: 'Moklet Hub Coworking Space (Updated)', description: 'Update nama coworking' })
  @IsString({ message: 'Nama coworking harus berupa string' })
  @IsNotEmpty({ message: 'Nama coworking tidak boleh kosong' })
  @MaxLength(200, { message: 'Nama coworking maksimal 200 karakter' })
  nama_coworking!: string;

  @ApiProperty({ example: 'Ahmad Bidin, S.Kom', description: 'Update nama pemilik' })
  @IsString({ message: 'Nama pemilik harus berupa string' })
  @IsNotEmpty({ message: 'Nama pemilik tidak boleh kosong' })
  @MaxLength(200, { message: 'Nama pemilik maksimal 200 karakter' })
  nama_pemilik!: string;

  @ApiProperty({ example: '081298765432', description: 'Update kontak/telp' })
  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @MaxLength(50, { message: 'Nomor telepon maksimal 50 karakter' })
  telp!: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 1, Sawojajar, Malang', description: 'Update alamat operasional' })
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional({ example: 'WiFi 100Mbps, 5 Meeting Rooms, Coffee Corner, Musholla', description: 'Update deskripsi fasilitas' })
  @IsString()
  @IsOptional()
  deskripsi_fasilitas?: string;
}

export class CreateMemberAdminDto {
  @ApiProperty({ example: 'budi_santoso', description: 'Pembuatan username global baru' })
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @MaxLength(100, { message: 'Username maksimal 100 karakter' })
  username!: string;

  @ApiProperty({ example: 'Password123!', description: 'Password minimal 6 karakter', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap member baru' })
  @IsString()
  @IsNotEmpty({ message: 'Nama member tidak boleh kosong' })
  @MaxLength(200, { message: 'Nama member maksimal 200 karakter' })
  nama_member!: string;

  @ApiProperty({ example: 'SMK Telkom Malang', description: 'Asal instansi member' })
  @IsString()
  @IsNotEmpty({ message: 'Instansi tidak boleh kosong' })
  @MaxLength(200, { message: 'Instansi maksimal 200 karakter' })
  instansi!: string;

  @ApiProperty({ example: 'Jl. Danau Ranau No. 1, Sawojajar, Malang', description: 'Alamat lengkap member' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  alamat!: string;

  @ApiProperty({ example: '085712345678', description: 'Kontak aktif member' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @MaxLength(50, { message: 'Nomor telepon maksimal 50 karakter' })
  telp!: string;

  @ApiPropertyOptional({ example: 'budi.jpg', description: 'Object Key profil yang telah diunggah' })
  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateMemberAdminDto {
  @ApiPropertyOptional({ example: 'Budi Santoso, S.T.' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  nama_member?: string;

  @ApiPropertyOptional({ example: 'PT Teknologi Hebat' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  instansi?: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 2, Malang' })
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional({ example: '085712345678' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  telp?: string;

  @ApiPropertyOptional({ example: 'budi_new.jpg' })
  @IsString()
  @IsOptional()
  foto?: string;
}

export class AdminMemberQueryDto {
  @ApiPropertyOptional({ example: 'budi', description: 'Pencarian nama, instansi, atau telepon member' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Halaman data (1-based)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Jumlah data per halaman (max 100)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class UpdateReservasiStatusDto {
  @ApiProperty({ example: 'disetujui', description: 'Status persetujuan admin', enum: ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'] })
  @IsString()
  @IsIn(['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'])
  status!: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional({ example: 9, description: 'Bulan (1-12)', type: Number })
  @Type(() => Number)
  @IsInt({ message: 'Bulan harus berupa bilangan bulat' })
  @Min(1, { message: 'Bulan minimal 1 (Januari)' })
  @Max(12, { message: 'Bulan maksimal 12 (Desember)' })
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Tahun', type: Number })
  @Type(() => Number)
  @IsInt({ message: 'Tahun harus berupa bilangan bulat' })
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;
}
