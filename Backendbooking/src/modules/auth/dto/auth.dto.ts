import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterMemberDto {
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama member tidak boleh kosong' })
  nama_member!: string;

  @IsString()
  @IsNotEmpty({ message: 'Instansi tidak boleh kosong' })
  instansi!: string;

  @IsString()
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  alamat!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  telp!: string;

  @IsString()
  @IsOptional()
  foto?: string;
}

export class RegisterAdminSpaceDto {
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

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

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password!: string;
}
