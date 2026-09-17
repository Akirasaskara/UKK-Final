import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiskonDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  nama_diskon!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Persentase minimal 1%' })
  @Max(100, { message: 'Persentase maksimal 100%' })
  persentase_diskon!: number;

  @IsString()
  @IsNotEmpty({ message: 'Tanggal awal tidak boleh kosong' })
  tanggal_awal!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tanggal akhir tidak boleh kosong' })
  tanggal_akhir!: string;
}

export class UpdateDiskonDto {
  @IsString()
  @IsOptional()
  nama_diskon?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  persentase_diskon?: number;

  @IsString()
  @IsOptional()
  tanggal_awal?: string;

  @IsString()
  @IsOptional()
  tanggal_akhir?: string;
}
