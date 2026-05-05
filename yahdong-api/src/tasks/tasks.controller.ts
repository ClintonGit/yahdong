import {
  Body, Controller, Delete, Get, HttpCode,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { CreateStatusDto } from './dto/create-status.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { ReorderStatusesDto } from './dto/reorder-statuses.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { ProjectGuard } from '../common/guards/project.guard'
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator'

@Controller()
@UseGuards(JwtAuthGuard, ProjectGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get('projects/:id/tasks')
  findAll(@Param('id') projectId: string) {
    return this.tasks.findAll(projectId)
  }

  @Post('projects/:id/tasks')
  create(
    @Param('id') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(projectId, user.sub, dto)
  }

  @Get('tasks/:taskId')
  findOne(@Param('taskId') id: string) {
    return this.tasks.findOne(id)
  }

  @Patch('tasks/:taskId')
  update(
    @Param('taskId') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasks.update(id, user.sub, dto)
  }

  @Delete('tasks/:taskId')
  @HttpCode(204)
  remove(@Param('taskId') id: string) {
    return this.tasks.remove(id)
  }

  @Patch('tasks/:taskId/move')
  move(@Param('taskId') id: string, @Body() dto: MoveTaskDto) {
    return this.tasks.move(id, dto)
  }

  @Get('projects/:id/statuses')
  findStatuses(@Param('id') projectId: string) {
    return this.tasks.findStatuses(projectId)
  }

  @Post('projects/:id/statuses')
  createStatus(@Param('id') projectId: string, @Body() dto: CreateStatusDto) {
    return this.tasks.createStatus(projectId, dto)
  }

  @Patch('statuses/:statusId')
  updateStatus(@Param('statusId') id: string, @Body() dto: UpdateStatusDto) {
    return this.tasks.updateStatus(id, dto)
  }

  @Delete('statuses/:statusId')
  @HttpCode(204)
  removeStatus(@Param('statusId') id: string) {
    return this.tasks.removeStatus(id)
  }

  @Patch('projects/:id/statuses/reorder')
  reorderStatuses(@Param('id') projectId: string, @Body() dto: ReorderStatusesDto) {
    return this.tasks.reorderStatuses(projectId, dto)
  }
}
