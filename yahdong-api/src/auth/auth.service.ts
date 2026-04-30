import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    })
    return user
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.generateTokens(user.id, user.email, user.name)
    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    }
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    })
    if (!stored) throw new UnauthorizedException('Invalid refresh token')

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user) throw new UnauthorizedException()

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      { expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m' },
    )
    return { accessToken }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  private async generateTokens(userId: string, email: string, name: string) {
    const payload = { sub: userId, email, name }
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    })
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      secret: this.config.get('JWT_SECRET') + '_refresh',
    })

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    })

    return { accessToken, refreshToken }
  }
}
