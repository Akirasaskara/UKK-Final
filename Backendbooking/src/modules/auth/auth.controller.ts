import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterMemberDto, RegisterAdminSpaceDto, LoginDto } from './dto/auth.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @ApiOperation({ summary: 'Registrasi Member Baru' })
  @ApiResponse({ status: 201, description: 'Registrasi berhasil dan token diterbitkan.' })
  @ApiResponse({ status: 400, description: 'Format kredensial tidak valid' })
  @ApiResponse({ status: 409, description: 'Username sudah digunakan' })
  @Public()
  @Post('register/member')
  @HttpCode(HttpStatus.CREATED)
  async registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @ApiOperation({ summary: 'Registrasi Pengelola (Admin Space) Baru' })
  @ApiResponse({ status: 201, description: 'Registrasi admin berhasil dan token diterbitkan.' })
  @Public()
  @Post('register/admin-space')
  @HttpCode(HttpStatus.CREATED)
  async registerAdminSpace(@Body() dto: RegisterAdminSpaceDto) {
    return this.authService.registerAdminSpace(dto);
  }

  @ApiOperation({ summary: 'Login Pengguna (Member atau Admin Space)' })
  @ApiResponse({ status: 200, description: 'Login berhasil, token terbit.' })
  @ApiResponse({ status: 401, description: 'Kredensial atau password salah.' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil Profil Pengguna Login Saat Ini' })
  @ApiResponse({ status: 200, description: 'Data profil beserta relasi.' })
  @ApiResponse({ status: 401, description: 'Token tidak diberikan atau kadaluwarsa.' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user);
  }
}
