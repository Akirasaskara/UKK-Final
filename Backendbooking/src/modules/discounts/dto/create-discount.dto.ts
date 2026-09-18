import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiskonDto {
  @ApiProperty({ example: 'PROMOAGUSTUS', description: 'Kode promo, disarankan huruf kapital tanpa spasi' })
  @IsString()
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  nama_diskon!: string;

  @ApiProperty({ example: 20, description: 'Besaran persentase diskon (1-100)', minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Persentase minimal 1%' })
  @Max(100, { message: 'Persentase maksimal 100%' })
  persentase_diskon!: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z', description: 'Waktu mulai berlaku (UTC)' })
  @IsString()
  @IsNotEmpty({ message: 'Tanggal awal tidak boleh kosong' })
  tanggal_awal!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z', description: 'Waktu kedaluwarsa (UTC)' })
  @IsString()
  @IsNotEmpty({ message: 'Tanggal akhir tidak boleh kosong' })
  tanggal_akhir!: string;
}

export class UpdateDiskonDto {
  @ApiPropertyOptional({ example: 'PROMOAGUSTUS2026', description: 'Update kode promo' })
  @IsString()
  @IsOptional()
  nama_diskon?: string;

  @ApiPropertyOptional({ example: 25, description: 'Update persentase diskon (1-100)', minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  persentase_diskon?: number;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z', description: 'Update waktu mulai berlaku (UTC)' })
  @IsString()
  @IsOptional()
  tanggal_awal?: string;

  @ApiPropertyOptional({ example: '2026-09-15T23:59:59.000Z', description: 'Update waktu kedaluwarsa (UTC)' })
  @IsString()
  @IsOptional()
  tanggal_akhir?: string;
}
