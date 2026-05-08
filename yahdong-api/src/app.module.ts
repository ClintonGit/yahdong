import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ProjectsModule } from './projects/projects.module'
import { TasksModule } from './tasks/tasks.module'
import { EmailModule } from './email/email.module'
import { CommentsModule } from './comments/comments.module'
import { UploadsModule } from './uploads/uploads.module'
import { PublicModule } from './public/public.module'
import { NotificationsModule } from './notifications/notifications.module'
import { UnfurlModule } from './unfurl/unfurl.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limit: 100 req / minute / IP. Auth endpoints override this
    // with a stricter @Throttle({ default: { limit: 5, ttl: 60_000 } }).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    EmailModule,
    CommentsModule,
    UploadsModule,
    PublicModule,
    NotificationsModule,
    UnfurlModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
