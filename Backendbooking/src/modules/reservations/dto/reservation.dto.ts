import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservasiDto {
  @Type(() => Number)
  @IsNumber()
  id_space!: number;

  @IsString()
  @IsNotEmpty({ message: 'Tanggal reservasi tidak boleh kosong' })
  tanggal_reservasi!: string;

  @IsString()
  @IsNotEmpty({ message: 'Jam mulai tidak boleh kosong' })
  jam_mulai!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Durasi sewa minimal 1 jam' })
  durasi_jam!: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  id_diskon?: number;

  @IsString()
  @IsOptional()
  kode_promo?: string;
}

export class HistoryQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  month?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;
}
