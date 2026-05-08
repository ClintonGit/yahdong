import {
  Controller,
  Get,
  Param,
  Patch,
  HttpCode,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { SseJwtGuard } from '../common/guards/sse-jwt.guard'
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator'

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  // ── SSE stream ───────────────────────────────────────────────────────────
  // EventSource cannot send Authorization headers, so this endpoint accepts
  // the access token via `?token=` and uses a JWT-aware guard tailored for
  // SSE. Declared before any `@Get(':id')` style route would be needed, but
  // also above the `@UseGuards(JwtAuthGuard)` block so it doesn't pick up
  // the bearer-only guard from the rest of the controller.
  @Sse('stream')
  @UseGuards(SseJwtGuard)
  stream(@CurrentUser() user: JwtPayload): Observable<MessageEvent> {
    return this.notifications.subscribe(user.sub) as Observable<MessageEvent>
  }

  // ── Auth-protected REST endpoints ────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.findAll(user.sub)
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.getUnreadCount(user.sub)
  }

  // Static routes before dynamic routes to avoid shadowing
  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub)
  }

  @Patch('tasks/:taskId/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  markTaskRead(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markTaskRead(user.sub, taskId)
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markRead(id, user.sub)
  }
}
