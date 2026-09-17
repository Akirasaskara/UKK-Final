import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckPromoDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  nama_diskon!: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  id_space?: number;
}
