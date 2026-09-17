import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service.js';
import {
  RegisterMemberDto,
  RegisterAdminSpaceDto,
  LoginDto,
} from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.username,
          passwordHash,
          role: 'member',
        },
      });

      const member = await tx.member.create({
        data: {
          idUser: user.id,
          roleGuard: 'member',
          namaMember: dto.nama_member,
          instansi: dto.instansi,
          alamat: dto.alamat,
          telp: dto.telp,
          foto: dto.foto || null,
        },
      });

      const token = this.jwtService.sign({
        sub: user.id.toString(),
        username: user.username,
        role: user.role,
      });

      return {
        message: 'Registrasi member berhasil!',
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          member: {
            id: member.id,
            nama_member: member.namaMember,
            instansi: member.instansi,
            alamat: member.alamat,
            telp: member.telp,
            foto: member.foto,
          },
          access_token: token,
        },
      };
    });
  }

  async registerAdminSpace(dto: RegisterAdminSpaceDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.username,
          passwordHash,
          role: 'admin_space',
        },
      });

      const spaceOwner = await tx.spaceOwner.create({
        data: {
          idUser: user.id,
          roleGuard: 'admin_space',
          namaCoworking: dto.nama_coworking,
          namaPemilik: dto.nama_pemilik,
          telp: dto.telp,
          alamat: dto.alamat || null,
          deskripsiFasilitas: dto.deskripsi_fasilitas || null,
        },
      });

      const token = this.jwtService.sign({
        sub: user.id.toString(),
        username: user.username,
        role: user.role,
      });

      return {
        message: 'Registrasi Admin Space berhasil!',
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          space_owner: {
            id: spaceOwner.id,
            nama_coworking: spaceOwner.namaCoworking,
            nama_pemilik: spaceOwner.namaPemilik,
            telp: spaceOwner.telp,
            alamat: spaceOwner.alamat,
            deskripsi_fasilitas: spaceOwner.deskripsiFasilitas,
          },
          access_token: token,
        },
      };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        member: true,
        spaceOwner: true,
      },
    });

    if (!user || user.archivedAt) {
      throw new UnauthorizedException('Username atau Password salah!');
    }

    const isMatch = await argon2.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Username atau Password salah!');
    }

    const token = this.jwtService.sign({
      sub: user.id.toString(),
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Login berhasil!',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        member: user.member
          ? {
              id: user.member.id,
              nama_member: user.member.namaMember,
              instansi: user.member.instansi,
              alamat: user.member.alamat,
              telp: user.member.telp,
              foto: user.member.foto,
            }
          : null,
        space_owner: user.spaceOwner
          ? {
              id: user.spaceOwner.id,
              nama_coworking: user.spaceOwner.namaCoworking,
              nama_pemilik: user.spaceOwner.namaPemilik,
              telp: user.spaceOwner.telp,
            }
          : null,
        access_token: token,
      },
    };
  }

  async getProfile(user: any) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        member: true,
        spaceOwner: true,
      },
    });

    if (!profile) {
      throw new UnauthorizedException('Profil tidak ditemukan');
    }

    return {
      id: profile.id,
      username: profile.username,
      role: profile.role,
      member: profile.member
        ? {
            id: profile.member.id,
            nama_member: profile.member.namaMember,
            instansi: profile.member.instansi,
            alamat: profile.member.alamat,
            telp: profile.member.telp,
            foto: profile.member.foto,
          }
        : null,
      space_owner: profile.spaceOwner
        ? {
            id: profile.spaceOwner.id,
            nama_coworking: profile.spaceOwner.namaCoworking,
            nama_pemilik: profile.spaceOwner.namaPemilik,
            telp: profile.spaceOwner.telp,
            alamat: profile.spaceOwner.alamat,
            deskripsi_fasilitas: profile.spaceOwner.deskripsiFasilitas,
          }
        : null,
    };
  }
}
