import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import type { JwtPayload } from '../decorators/current-user.decorator'

/**
 * Guard for Server-Sent Event (SSE) endpoints.
 *
 * Native browser `EventSource` cannot send custom headers, so the standard
 * `Authorization: Bearer …` header used by `JwtAuthGuard` is unreachable.
 * Instead the access token is passed through the `?token=` query parameter
 * (still over HTTPS in prod) and verified manually here.
 *
 * On success the verified payload is attached to `request.user` so the
 * existing `@CurrentUser()` decorator works unchanged.
 */
@Injectable()
export class SseJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const tokenRaw = request.query?.token
    const token =
      typeof tokenRaw === 'string'
        ? tokenRaw
        : Array.isArray(tokenRaw) && typeof tokenRaw[0] === 'string'
          ? tokenRaw[0]
          : null
    if (!token) throw new UnauthorizedException('Missing token query param')

    const secret = this.config.get<string>('JWT_SECRET')
    if (!secret) throw new UnauthorizedException('JWT misconfigured')

    try {
      const payload = this.jwt.verify<JwtPayload>(token, { secret })
      if (!payload?.sub) throw new UnauthorizedException()
      // Mirror passport-jwt: attach to request.user so @CurrentUser() works.
      ;(request as Request & { user?: JwtPayload }).user = payload
      return true
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
