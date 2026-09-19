import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiskonDto {
  @ApiProperty({ example: 'PROMOAGUSTUS', description: 'Kode promo unik' })
  @IsString({ message: 'Kode promo harus berupa string' })
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  @MaxLength(100, { message: 'Kode promo maksimal 100 karakter' })
  nama_diskon!: string;

  @ApiProperty({ example: 20, description: 'Besaran persentase diskon (1-100)', minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt({ message: 'Persentase diskon harus berupa bilangan bulat' })
  @Min(1, { message: 'Persentase minimal 1%' })
  @Max(100, { message: 'Persentase maksimal 100%' })
  persentase_diskon!: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z', description: 'Waktu mulai berlaku (ISO String / UTC)' })
  @IsString({ message: 'Tanggal awal harus berupa string tanggal ISO yang valid' })
  @IsNotEmpty({ message: 'Tanggal awal tidak boleh kosong' })
  tanggal_awal!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z', description: 'Waktu kedaluwarsa (ISO String / UTC)' })
  @IsString({ message: 'Tanggal akhir harus berupa string tanggal ISO yang valid' })
  @IsNotEmpty({ message: 'Tanggal akhir tidak boleh kosong' })
  tanggal_akhir!: string;
}

export class UpdateDiskonDto {
  @ApiPropertyOptional({ example: 1, description: 'Nomor versi untuk optimis concurrency lock' })
  @Type(() => Number)
  @IsInt({ message: 'expected_version harus berupa bilangan bulat' })
  @IsOptional()
  expected_version?: number;

  @ApiPropertyOptional({ example: 'PROMOAGUSTUS2026', description: 'Update kode promo' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  nama_diskon?: string;

  @ApiPropertyOptional({ example: 25, description: 'Update persentase diskon (1-100)', minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt({ message: 'Persentase diskon harus berupa bilangan bulat' })
  @Min(1)
  @Max(100)
  @IsOptional()
  persentase_diskon?: number;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z', description: 'Update waktu mulai berlaku (ISO String / UTC)' })
  @IsString()
  @IsOptional()
  tanggal_awal?: string;

  @ApiPropertyOptional({ example: '2026-09-15T23:59:59.000Z', description: 'Update waktu kedaluwarsa (ISO String / UTC)' })
  @IsString()
  @IsOptional()
  tanggal_akhir?: string;
}

export class AdminPromotionQueryDto {
  @ApiPropertyOptional({ example: 'HEMAT', description: 'Pencarian kode promo' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['upcoming', 'active', 'expired'] })
  @IsString()
  @IsIn(['upcoming', 'active', 'expired'])
  @IsOptional()
  status?: string;

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
