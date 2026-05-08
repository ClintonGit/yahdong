import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateCommentDto } from './dto/create-comment.dto'

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name)

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

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
      select: { id: true, projectId: true, title: true },
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
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      const notifications: { userId: string; taskId: string; commentId: string; type: string; body: string }[] = []
      const mentionedMembers: { id: string; name: string; email: string }[] = []
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
          mentionedMembers.push(m.user)
        }
      }
      if (notifications.length > 0) {
        await this.prisma.notification.createMany({ data: notifications })
        // Push SSE event so any tab the mentioned user has open refreshes
        // immediately instead of waiting for the polling tick.
        this.notifications.publishMany(
          notifications.map((n) => n.userId),
          { type: 'mention', data: { taskId, commentId: comment.id } },
        )
        // Fire-and-forget mention emails (mirrors tasks.service assign flow).
        for (const target of mentionedMembers) {
          void this.email
            .sendCommentMention({
              mentionedName: target.name,
              mentionedEmail: target.email,
              mentionerName: comment.user.name,
              taskTitle: task.title,
              commentBody: dto.body,
              projectId: task.projectId,
            })
            .catch((err: unknown) =>
              this.logger.error(
                `sendCommentMention failed for ${target.email}: ${(err as Error).message}`,
              ),
            )
        }
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
