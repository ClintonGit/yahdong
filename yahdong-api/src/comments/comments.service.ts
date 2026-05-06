import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCommentDto } from './dto/create-comment.dto'

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    })
    if (!task) throw new NotFoundException('Task not found')

    const comment = await this.prisma.comment.create({
      data: { taskId, userId, body: dto.body, imageUrl: dto.imageUrl },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })

    // Parse @mentions and create notifications
    if (dto.body) {
      const members = await this.prisma.projectMember.findMany({
        where: { projectId: task.projectId },
        include: { user: { select: { id: true, name: true } } },
      })
      const notifications: { userId: string; taskId: string; commentId: string; type: string; body: string }[] = []
      for (const m of members) {
        if (m.userId === userId) continue
        if (dto.body.includes(`@${m.user.name}`)) {
          notifications.push({
            userId: m.userId,
            taskId,
            commentId: comment.id,
            type: 'mention',
            body: `${comment.user.name} กล่าวถึงคุณใน comment`,
          })
        }
      }
      if (notifications.length > 0) {
        await this.prisma.notification.createMany({ data: notifications })
      }
    }

    return comment
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) throw new NotFoundException()
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment')
    await this.prisma.comment.delete({ where: { id: commentId } })
  }
}
