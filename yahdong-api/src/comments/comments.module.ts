import { Module } from '@nestjs/common'
import { CommentsController } from './comments.controller'
import { CommentsService } from './comments.service'
import { EmailModule } from '../email/email.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
