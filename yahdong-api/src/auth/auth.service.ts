import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

// 2026 baseline. Anything below this is lazily upgraded after a successful
// login. Bumping this value automatically triggers re-hash for the next login
// of users still on the old cost — no migration script required.
const BCRYPT_COST = 12

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST)
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

    // Lazy re-hash: if this user's password is still stored under an older
    // bcrypt cost (e.g. legacy cost=10), upgrade it to BCRYPT_COST now that
    // we've verified the plaintext. Failures are logged but never block login.
    await this.maybeUpgradeHash(user.id, user.passwordHash, dto.password)

    const tokens = await this.generateTokens(user.id, user.email, user.name)
    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    }
  }

  private async maybeUpgradeHash(
    userId: string,
    currentHash: string,
    plaintext: string,
  ): Promise<void> {
    try {
      const currentCost = bcrypt.getRounds(currentHash)
      if (currentCost >= BCRYPT_COST) return

      const newHash = await bcrypt.hash(plaintext, BCRYPT_COST)
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      })
      this.logger.log(
        `Upgraded password hash for user ${userId} (cost ${currentCost} → ${BCRYPT_COST})`,
      )
    } catch (err) {
      // Don't block login on a re-hash failure — user already authenticated.
      this.logger.warn(
        `Lazy re-hash failed for user ${userId}: ${(err as Error).message}`,
      )
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

  private getRefreshSecret(): string {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')
    if (!refreshSecret || refreshSecret.trim().length === 0) {
      // Fail-closed: never silently derive a secret. In all environments we
      // want operators to provision JWT_REFRESH_SECRET as an independent value
      // so that an access-token-secret leak does not compromise refresh tokens.
      throw new Error('JWT_REFRESH_SECRET env var is required and must be non-empty')
    }
    return refreshSecret
  }

  private async generateTokens(userId: string, email: string, name: string) {
    const payload = { sub: userId, email, name }
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    })
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      secret: this.getRefreshSecret(),
    })

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    })

    return { accessToken, refreshToken }
  }
}
