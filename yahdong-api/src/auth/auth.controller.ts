import { Body, Controller, Delete, HttpCode, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { JwtPayload } from '../common/decorators/current-user.decorator'

// 5 requests / minute / IP for every auth endpoint — brute-force defense.
@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Delete('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: JwtPayload) {
    return this.auth.logout(user.sub)
  }
}
