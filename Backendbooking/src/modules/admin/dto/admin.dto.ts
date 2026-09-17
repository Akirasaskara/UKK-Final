import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCoworkingProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama coworking tidak boleh kosong' })
  nama_coworking!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama pemilik tidak boleh kosong' })
  nama_pemilik!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  telp!: string;

  @IsString()
  @IsOptional()
  alamat?: string;

  @IsString()
  @IsOptional()
  deskripsi_fasilitas?: string;
}

export class CreateMemberAdminDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  nama_member!: string;

  @IsString()
  @IsNotEmpty()
  instansi!: string;

  @IsString()
  @IsNotEmpty()
  alamat!: string;

  @IsString()
  @IsNotEmpty()
  telp!: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateMemberAdminDto {
  @IsString()
  @IsOptional()
  nama_member?: string;

  @IsString()
  @IsOptional()
  instansi?: string;

  @IsString()
  @IsOptional()
  alamat?: string;

  @IsString()
  @IsOptional()
  telp?: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateReservasiStatusDto {
  @IsString()
  @IsIn(['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'])
  status!: string;
}

export class ReportQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  month?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;
}
