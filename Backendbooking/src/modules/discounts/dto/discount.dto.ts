import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckPromoDto {
  @ApiProperty({ example: 'PROMOHEMAT20', description: 'Kode promo yang akan dicek validitasnya' })
  @IsString()
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  nama_diskon!: string;

  @ApiPropertyOptional({ example: 1, description: 'ID Space untuk verifikasi promo space yang sesuai', type: Number })
  @Type(() => Number)
  @IsOptional()
  id_space?: number;
}
