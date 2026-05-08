import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import helmet from 'helmet'

async function bootstrap() {
  // Fail fast if JWT_SECRET is missing — never fall back to a literal.
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET env var is required and must be non-empty')
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // Security headers (X-Frame-Options, CSP, HSTS, etc.).
  // crossOriginResourcePolicy disabled so /uploads/* can be embedded by the
  // webapp from a different origin while we still benefit from the rest.
  app.use(helmet({ crossOriginResourcePolicy: false }))

  // CORS — explicit allowlist from env, with sensible dev/prod defaults.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
  const allowedOrigins =
    corsOrigins.length > 0
      ? corsOrigins
      : ['http://localhost:5173', 'https://yahdong.commsk.dev']
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  const uploadsDir = join(process.cwd(), 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' })

  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
