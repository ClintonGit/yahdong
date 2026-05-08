import { Module } from '@nestjs/common'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { EmailModule } from '../email/email.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
