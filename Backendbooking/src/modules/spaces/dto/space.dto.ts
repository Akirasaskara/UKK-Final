import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpaceDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama space tidak boleh kosong' })
  nama_space!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Harga per jam harus non-negatif' })
  harga_per_jam!: number;

  @IsString()
  @IsIn(['desk', 'meeting_room', 'private_office'], {
    message: 'Tipe space harus salah satu dari: desk, meeting_room, private_office',
  })
  tipe!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Kapasitas minimal 1 orang' })
  kapasitas!: number;

  @IsString()
  @IsNotEmpty({ message: 'Deskripsi fasilitas tidak boleh kosong' })
  deskripsi!: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateSpaceDto {
  @IsString()
  @IsOptional()
  nama_space?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  harga_per_jam?: number;

  @IsString()
  @IsIn(['desk', 'meeting_room', 'private_office'])
  @IsOptional()
  tipe?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  kapasitas?: number;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

export class CheckAvailabilityQueryDto {
  @Type(() => Number)
  @IsNumber()
  id_space!: number;

  @IsString()
  @IsNotEmpty()
  tanggal!: string;

  @IsString()
  @IsNotEmpty()
  jam_mulai!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durasi_jam!: number;
}
