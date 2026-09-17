import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string | number; username: string; role: string }) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token payload tidak valid');
    }

    const userId = BigInt(payload.sub);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
        spaceOwner: true,
      },
    });

    if (!user || user.archivedAt) {
      throw new UnauthorizedException('Pengguna tidak valid atau telah dinonaktifkan');
    }

    if (user.role === 'member' && !user.member) {
      throw new UnauthorizedException('Profil member tidak ditemukan');
    }

    if (user.role === 'admin_space' && !user.spaceOwner) {
      throw new UnauthorizedException('Profil space owner tidak ditemukan');
    }

    if (user.role !== 'member' && user.role !== 'admin_space') {
      throw new UnauthorizedException('Role pengguna tidak valid');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      member: user.member,
      spaceOwner: user.spaceOwner,
    };
  }
}
