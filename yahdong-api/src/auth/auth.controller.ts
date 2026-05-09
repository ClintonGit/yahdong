import { Body, Controller, Delete, HttpCode, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { JwtPayload } from '../common/decorators/current-user.decorator'

// 5 requests / minute / IP for every auth endpoint — brute-force defense.
@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new local account' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Email + password login' })
  @ApiResponse({ status: 200, description: 'Returns access + refresh tokens and user' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new access token' })
  @ApiResponse({ status: 200, description: 'Returns new access token' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid, revoked, or expired' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Delete('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @ApiResponse({ status: 204, description: 'Logged out' })
  logout(@CurrentUser() user: JwtPayload) {
    return this.auth.logout(user.sub)
  }
}
