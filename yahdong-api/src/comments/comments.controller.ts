import {
  Body, Controller, Delete, Get,
  HttpCode, Param, Post, UseGuards,
} from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator'

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @Get('tasks/:taskId/comments')
  findAll(@Param('taskId') taskId: string) {
    return this.comments.findByTask(taskId)
  }

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(taskId, user.sub, dto)
  }

  @Delete('comments/:commentId')
  @HttpCode(204)
  remove(@Param('commentId') id: string, @CurrentUser() user: JwtPayload) {
    return this.comments.remove(id, user.sub)
  }
}
