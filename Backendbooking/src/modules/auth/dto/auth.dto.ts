import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterMemberDto {
  @ApiProperty({ example: 'Kevin', description: 'Username unik member' })
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username!: string;

  @ApiProperty({ example: 'Password123!', description: 'Password minimal 6 karakter', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @ApiProperty({ example: 'Kevin Haryono', description: 'Nama lengkap member' })
  @IsString()
  @IsNotEmpty({ message: 'Nama member tidak boleh kosong' })
  nama_member!: string;

  @ApiProperty({ example: 'Institut Teknologi Bandung', description: 'Instansi atau perusahaan' })
  @IsString()
  @IsNotEmpty({ message: 'Instansi tidak boleh kosong' })
  instansi!: string;

  @ApiProperty({ example: 'l. Ganesa No. 10, Coblong, Kota Bandung', description: 'Alamat lengkap' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  alamat!: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  telp!: string;

  @ApiPropertyOptional({ example: '1789631136452-966684605.jpg', description: 'Nama file foto profil (object key S3) yang sudah di-upload via endpoint terpisah' })
  @IsString()
  @IsOptional()
  foto?: string;
}

export class RegisterAdminSpaceDto {
  @ApiProperty({ example: 'admin_coworking', description: 'Username unik pengelola space' })
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username!: string;

  @ApiProperty({ example: 'Password123!', description: 'Password minimal 6 karakter', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @ApiProperty({ example: 'Moklet Coworking Space', description: 'Nama lokasi coworking' })
  @IsString()
  @IsNotEmpty({ message: 'Nama coworking tidak boleh kosong' })
  nama_coworking!: string;

  @ApiProperty({ example: 'Ahmad Bidin, S.Kom', description: 'Nama pemilik coworking' })
  @IsString()
  @IsNotEmpty({ message: 'Nama pemilik tidak boleh kosong' })
  nama_pemilik!: string;

  @ApiProperty({ example: '081298765432', description: 'Nomor telepon kontak pengelola' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  telp!: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 1 Sawojajar, Malang', description: 'Alamat coworking space' })
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional({ example: 'High-Speed WiFi 100Mbps, AC Dingin, Free Flow Kopi & Teh, Musholla, Parkir Luas', description: 'Daftar fasilitas umum yang tersedia' })
  @IsString()
  @IsOptional()
  deskripsi_fasilitas?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'johndoe', description: 'Username pengguna terdaftar' })
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username!: string;

  @ApiProperty({ example: 'Password123!', description: 'Password pengguna' })
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password!: string;
}
