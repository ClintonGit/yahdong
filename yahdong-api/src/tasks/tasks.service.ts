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

const ASSIGNEE_INCLUDE = {
  assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
}

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
        ...ASSIGNEE_INCLUDE,
        status: true,
        labels: { include: { label: true } },
        _count: { select: { checklistItems: true } },
      },
      orderBy: { order: 'asc' },
    })
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    const { assigneeIds, ...rest } = dto

    const lastTask = await this.prisma.task.findFirst({
      where: { projectId, statusId: dto.statusId },
      orderBy: { order: 'desc' },
    })
    const order = (lastTask?.order ?? 0) + 1000

    const task = await this.prisma.task.create({
      data: { ...rest, projectId, createdBy: userId, order },
      include: {
        ...ASSIGNEE_INCLUDE,
        status: true,
        labels: { include: { label: true } },
      },
    })

    if (assigneeIds?.length) {
      await this.prisma.taskAssignee.createMany({
        data: assigneeIds.map((uid) => ({ taskId: task.id, userId: uid })),
        skipDuplicates: true,
      })
      return this.prisma.task.findUnique({
        where: { id: task.id },
        include: {
          ...ASSIGNEE_INCLUDE,
          status: true,
          labels: { include: { label: true } },
        },
      })
    }

    return task
  }

  async findOne(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        ...ASSIGNEE_INCLUDE,
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
    const { assigneeIds, ...rest } = dto

    if (assigneeIds !== undefined) {
      const task = await this.prisma.$transaction(async (tx) => {
        await tx.taskAssignee.deleteMany({ where: { taskId } })
        if (assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: assigneeIds.map((userId) => ({ taskId, userId })),
            skipDuplicates: true,
          })
        }
        return tx.task.update({
          where: { id: taskId },
          data: rest,
          include: {
            ...ASSIGNEE_INCLUDE,
            status: true,
            labels: { include: { label: true } },
          },
        })
      })

      // Fire email notifications for newly assigned users
      if (assigneeIds.length > 0) {
        void this.fireAssigneeEmails(taskId, task.projectId, assigneeIds, actorId, task.title)
      }

      return task
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: rest,
      include: {
        ...ASSIGNEE_INCLUDE,
        status: true,
        labels: { include: { label: true } },
      },
    })
  }

  private async fireAssigneeEmails(
    _taskId: string,
    projectId: string,
    assigneeIds: string[],
    actorId: string,
    taskTitle: string,
  ) {
    const [actor, project, assignees] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: actorId }, select: { name: true } }),
      this.prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
      this.prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { name: true, email: true },
      }),
    ])
    if (!actor || !project) return
    for (const assignee of assignees) {
      void this.email.sendTaskAssigned({
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        assignerName: actor.name,
        taskTitle,
        projectName: project.name,
        projectId,
      })
    }
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
