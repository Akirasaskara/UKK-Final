import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterMemberDto, RegisterAdminSpaceDto, LoginDto } from './dto/auth.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Public()
  @Post('register/member')
  @HttpCode(HttpStatus.CREATED)
  async registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Public()
  @Post('register/admin-space')
  @HttpCode(HttpStatus.CREATED)
  async registerAdminSpace(@Body() dto: RegisterAdminSpaceDto) {
    return this.authService.registerAdminSpace(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user);
  }
}
