import { Controller, Get, Param, Patch, HttpCode, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.findAll(user.sub)
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.getUnreadCount(user.sub)
  }

  // Static routes before dynamic routes to avoid shadowing
  @Patch('read-all')
  @HttpCode(200)
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub)
  }

  @Patch('tasks/:taskId/read')
  @HttpCode(200)
  markTaskRead(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markTaskRead(user.sub, taskId)
  }

  @Patch(':id/read')
  @HttpCode(200)
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markRead(id, user.sub)
  }
}
