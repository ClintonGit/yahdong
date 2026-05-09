import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import helmet from 'helmet'

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production'

  // Fail fast if JWT_SECRET is missing — never fall back to a literal.
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET env var is required and must be non-empty')
  }

  // Refresh tokens are signed with their own independent secret. Deriving it
  // from JWT_SECRET (e.g. JWT_SECRET + '_refresh') means a single leak
  // compromises both. Require operators to provision it explicitly.
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET
  if (!jwtRefreshSecret || jwtRefreshSecret.trim().length === 0) {
    throw new Error('JWT_REFRESH_SECRET env var is required and must be non-empty')
  }
  if (jwtRefreshSecret === jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET')
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // Security headers (X-Frame-Options, CSP, HSTS, etc.).
  // crossOriginResourcePolicy disabled so /uploads/* can be embedded by the
  // webapp from a different origin while we still benefit from the rest.
  app.use(helmet({ crossOriginResourcePolicy: false }))

  // ── CORS — strict allowlist ────────────────────────────────────────────────
  // Production: CORS_ORIGINS is REQUIRED — bootstrap fails if missing so we
  // never accidentally ship with a permissive localhost fallback.
  // Development: fall back to the Vite dev server.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)

  if (isProd && corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGINS env var is required in production (comma-separated allowlist)',
    )
  }

  const allowedOrigins =
    corsOrigins.length > 0 ? corsOrigins : ['http://localhost:5173']
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })

  // ── OpenAPI / Swagger ──────────────────────────────────────────────────────
  // Mounted at /api/docs to match the Yahdong/Todos pattern. JSON spec is
  // exposed at /api/docs-json so codegen tools can hit it directly.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Yahdong / Kanban API')
    .setDescription(
      'NestJS backend powering Kanban boards in the Yahdong universe. ' +
        'Auth uses JWT access (15m) + refresh (7d, sha256-stored). ' +
        'See /b/:shareToken for public-board access.',
    )
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by /auth/login or /auth/refresh',
      },
      'access-token',
    )
    .addTag('auth', 'Register / login / refresh / logout')
    .addTag('users', 'Profile + user search')
    .addTag('projects', 'Org-scoped projects, members, labels, invites, sharing')
    .addTag('tasks', 'Tasks, columns (statuses), checklist, labels')
    .addTag('comments', 'Task comments with mention + image')
    .addTag('uploads', 'Image upload pipeline (sharp → webp)')
    .addTag('notifications', 'SSE stream + read state')
    .addTag('public', 'Public board view + invite acceptance')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })

  const uploadsDir = join(process.cwd(), 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' })

  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
