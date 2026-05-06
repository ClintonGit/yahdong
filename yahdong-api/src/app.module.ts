import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
