import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservasiDto {
  @ApiProperty({ example: 1, description: 'ID Space yang akan dipesan' })
  @Type(() => Number)
  @IsNumber()
  id_space!: number;

  @ApiProperty({ example: '2026-09-30', description: 'Tanggal pemesanan (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Tanggal reservasi tidak boleh kosong' })
  tanggal_reservasi!: string;

  @ApiProperty({ example: '09:00', description: 'Waktu mulai pemakaian (HH:mm 24-hour)' })
  @IsString()
  @IsNotEmpty({ message: 'Jam mulai tidak boleh kosong' })
  jam_mulai!: string;

  @ApiProperty({ example: 3, description: 'Durasi waktu penyewaan', minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Durasi sewa minimal 1 jam' })
  durasi_jam!: number;

  @ApiPropertyOptional({ example: 1, description: 'ID Diskon promo yang dipilih' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  id_diskon?: number;

  @ApiPropertyOptional({ example: 'PROMOHEMAT20', description: 'Kode promo alternatif manual input' })
  @IsString()
  @IsOptional()
  kode_promo?: string;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ example: 9, description: 'Filter bulan kueri (1-12)', type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Filter tahun kueri', type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;
}
