import { Module } from '@nestjs/common'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'
import { EmailModule } from '../email/email.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
