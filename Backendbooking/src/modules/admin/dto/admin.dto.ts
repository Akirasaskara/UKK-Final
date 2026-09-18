import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCoworkingProfileDto {
  @ApiProperty({ example: 'Moklet Hub Coworking Space (Updated)', description: 'Update nama coworking' })
  @IsString()
  @IsNotEmpty({ message: 'Nama coworking tidak boleh kosong' })
  nama_coworking!: string;

  @ApiProperty({ example: 'Ahmad Bidin, S.Kom', description: 'Update nama pemilik' })
  @IsString()
  @IsNotEmpty({ message: 'Nama pemilik tidak boleh kosong' })
  nama_pemilik!: string;

  @ApiProperty({ example: '081298765432', description: 'Update kontak/telp' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
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
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'Password123!', description: 'Password minimal 6 karakter', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap member baru' })
  @IsString()
  @IsNotEmpty()
  nama_member!: string;

  @ApiProperty({ example: 'SMK Telkom Malang', description: 'Asal instansi member' })
  @IsString()
  @IsNotEmpty()
  instansi!: string;

  @ApiProperty({ example: 'Jl. Danau Ranau No. 1, Sawojajar, Malang', description: 'Alamat lengkap member' })
  @IsString()
  @IsNotEmpty()
  alamat!: string;

  @ApiProperty({ example: '085712345678', description: 'Kontak aktif member' })
  @IsString()
  @IsNotEmpty()
  telp!: string;

  @ApiPropertyOptional({ example: 'budi.jpg', description: 'Object Key profil yang telah diunggah' })
  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateMemberAdminDto {
  @ApiPropertyOptional({ example: 'Budi Santoso, S.T.' })
  @IsString()
  @IsOptional()
  nama_member?: string;

  @ApiPropertyOptional({ example: 'PT Teknologi Hebat' })
  @IsString()
  @IsOptional()
  instansi?: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 2, Malang' })
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional({ example: '085712345678' })
  @IsString()
  @IsOptional()
  telp?: string;

  @ApiPropertyOptional({ example: 'budi_new.jpg' })
  @IsString()
  @IsOptional()
  foto?: string;
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
  @IsNumber()
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Tahun', type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;
}
