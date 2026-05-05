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
    const task = await this.prisma.task.findUnique({ where: { id: taskId } })
    if (!task) throw new NotFoundException('Task not found')

    return this.prisma.comment.create({
      data: { taskId, userId, body: dto.body, imageUrl: dto.imageUrl },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) throw new NotFoundException()
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment')
    await this.prisma.comment.delete({ where: { id: commentId } })
  }
}
