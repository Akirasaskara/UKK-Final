import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpaceDto {
  @ApiProperty({ example: 'Personal Desk Alpha 01', description: 'Nama unik meja atau ruangan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama space tidak boleh kosong' })
  nama_space!: string;

  @ApiProperty({ example: 25000, description: 'Tarif sewa per jam (Integer IDR)', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Harga per jam harus non-negatif' })
  harga_per_jam!: number;

  @ApiProperty({ example: 'desk', description: 'Kategori ruangan (desk, meeting_room, private_office)', enum: ['desk', 'meeting_room', 'private_office'] })
  @IsString()
  @IsIn(['desk', 'meeting_room', 'private_office'], {
    message: 'Tipe space harus salah satu dari: desk, meeting_room, private_office',
  })
  tipe!: string;

  @ApiProperty({ example: 1, description: 'Kapasitas maksimum individu', minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Kapasitas minimal 1 orang' })
  kapasitas!: number;

  @ApiProperty({ example: 'Meja ergonomis, colokan listrik, WiFi 100Mbps, monitor 24 inch, free flow kopi/teh', description: 'Fasilitas dan ketentuan penggunaan' })
  @IsString()
  @IsNotEmpty({ message: 'Deskripsi fasilitas tidak boleh kosong' })
  deskripsi!: string;

  @ApiPropertyOptional({ example: '1789631136452-966684605.jpg', description: 'Object key foto dari proses upload sebelumnya' })
  @IsString()
  @IsOptional()
  foto?: string;
}

export class UpdateSpaceDto {
  @ApiPropertyOptional({ example: 'Personal Desk Alpha 01 (Updated)' })
  @IsString()
  @IsOptional()
  nama_space?: string;

  @ApiPropertyOptional({ example: 30000, type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  harga_per_jam?: number;

  @ApiPropertyOptional({ example: 'desk', enum: ['desk', 'meeting_room', 'private_office'] })
  @IsString()
  @IsIn(['desk', 'meeting_room', 'private_office'])
  @IsOptional()
  tipe?: string;

  @ApiPropertyOptional({ example: 2, type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  kapasitas?: number;

  @ApiPropertyOptional({ example: 'Upgrade dengan standing desk elektrik dan monitor 27 inch 4K' })
  @IsString()
  @IsOptional()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'desk_alpha_new.jpg' })
  @IsString()
  @IsOptional()
  foto?: string;
}

export class CheckAvailabilityQueryDto {
  @ApiProperty({ example: 1, description: 'ID space target' })
  @Type(() => Number)
  @IsNumber()
  id_space!: number;

  @ApiProperty({ example: '2026-09-30', description: 'Tanggal sewa (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  tanggal!: string;

  @ApiProperty({ example: '09:00', description: 'Jam mulai (HH:mm 24-hour)' })
  @IsString()
  @IsNotEmpty()
  jam_mulai!: string;

  @ApiProperty({ example: 3, description: 'Durasi sewa dalam jam', minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durasi_jam!: number;
}
