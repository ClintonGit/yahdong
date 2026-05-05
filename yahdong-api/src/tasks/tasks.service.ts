import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { CreateStatusDto } from './dto/create-status.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { ReorderStatusesDto } from './dto/reorder-statuses.dto'
import { SetLabelsDto } from './dto/set-labels.dto'
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto'
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto'

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async findAll(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        status: true,
        labels: { include: { label: true } },
        _count: { select: { checklistItems: true } },
      },
      orderBy: { order: 'asc' },
    })
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    const lastTask = await this.prisma.task.findFirst({
      where: { projectId, statusId: dto.statusId },
      orderBy: { order: 'desc' },
    })
    const order = (lastTask?.order ?? 0) + 1000

    return this.prisma.task.create({
      data: { ...dto, projectId, createdBy: userId, order },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        status: true,
        labels: { include: { label: true } },
      },
    })
  }

  async findOne(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        status: true,
        labels: { include: { label: true } },
        checklistItems: { orderBy: { order: 'asc' } },
        _count: { select: { comments: true } },
      },
    })
    if (!task) throw new NotFoundException()
    return task
  }

  async update(taskId: string, actorId: string, dto: UpdateTaskDto) {
    const oldAssigneeId = dto.assigneeId !== undefined
      ? (await this.prisma.task.findUnique({ where: { id: taskId }, select: { assigneeId: true, projectId: true } }))
      : null

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        status: true,
        labels: { include: { label: true } },
      },
    })

    if (
      oldAssigneeId &&
      dto.assigneeId &&
      dto.assigneeId !== oldAssigneeId.assigneeId &&
      task.assignee
    ) {
      void this.fireAssigneeEmail(task.id, task.title, oldAssigneeId.projectId, task.assignee, actorId)
    }

    return task
  }

  private async fireAssigneeEmail(
    _taskId: string,
    taskTitle: string,
    projectId: string,
    assignee: { name: string; email: string },
    actorId: string,
  ) {
    const [actor, project] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: actorId }, select: { name: true } }),
      this.prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
    ])
    if (!actor || !project) return
    void this.email.sendTaskAssigned({
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
      assignerName: actor.name,
      taskTitle,
      projectName: project.name,
      projectId,
    })
  }

  async remove(taskId: string) {
    await this.prisma.task.delete({ where: { id: taskId } })
  }

  async move(taskId: string, dto: MoveTaskDto) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: taskId } })
      if (!task) throw new NotFoundException()
      return tx.task.update({
        where: { id: taskId },
        data: { statusId: dto.statusId, order: dto.order },
      })
    })
  }

  // ── Statuses ─────────────────────────────────────────────────────────────
  async findStatuses(projectId: string) {
    return this.prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  }

  async createStatus(projectId: string, dto: CreateStatusDto) {
    const last = await this.prisma.taskStatus.findFirst({
      where: { projectId }, orderBy: { order: 'desc' },
    })
    return this.prisma.taskStatus.create({
      data: { ...dto, projectId, order: (last?.order ?? 0) + 1000 },
    })
  }

  async updateStatus(statusId: string, dto: UpdateStatusDto) {
    return this.prisma.taskStatus.update({ where: { id: statusId }, data: dto })
  }

  async removeStatus(statusId: string) {
    const count = await this.prisma.task.count({ where: { statusId } })
    if (count > 0) throw new BadRequestException('ย้าย tasks ออกก่อนลบ column นี้')
    await this.prisma.taskStatus.delete({ where: { id: statusId } })
  }

  async reorderStatuses(projectId: string, dto: ReorderStatusesDto) {
    await this.prisma.$transaction(
      dto.orderedIds.map((id, i) =>
        this.prisma.taskStatus.update({ where: { id }, data: { order: (i + 1) * 1000 } }),
      ),
    )
  }

  // ── Labels on task ───────────────────────────────────────────────────────
  async setLabels(taskId: string, dto: SetLabelsDto) {
    await this.prisma.taskLabel.deleteMany({ where: { taskId } })
    if (dto.labelIds.length > 0) {
      await this.prisma.taskLabel.createMany({
        data: dto.labelIds.map((labelId) => ({ taskId, labelId })),
        skipDuplicates: true,
      })
    }
    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: { labels: { include: { label: true } } },
    })
  }

  // ── Checklist ─────────────────────────────────────────────────────────────
  async getChecklist(taskId: string) {
    return this.prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
    })
  }

  async addChecklistItem(taskId: string, dto: CreateChecklistItemDto) {
    const last = await this.prisma.checklistItem.findFirst({
      where: { taskId }, orderBy: { order: 'desc' },
    })
    return this.prisma.checklistItem.create({
      data: { taskId, text: dto.text, order: (last?.order ?? 0) + 1000 },
    })
  }

  async updateChecklistItem(itemId: string, dto: UpdateChecklistItemDto) {
    return this.prisma.checklistItem.update({ where: { id: itemId }, data: dto })
  }

  async removeChecklistItem(itemId: string) {
    await this.prisma.checklistItem.delete({ where: { id: itemId } })
  }
}
