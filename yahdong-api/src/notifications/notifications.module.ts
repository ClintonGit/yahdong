import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { SseJwtGuard } from '../common/guards/sse-jwt.guard'

@Module({
  // AuthModule re-exports JwtModule (configured with the same secret used
  // for access tokens) so SseJwtGuard can verify query-string tokens.
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SseJwtGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
