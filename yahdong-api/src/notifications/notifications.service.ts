import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        task: { select: { id: true, title: true, projectId: true } },
      },
    })
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    })
    return { count }
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    })
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
  }

  async getUnreadByTask(userId: string, taskId: string) {
    return this.prisma.notification.findMany({
      where: { userId, taskId, readAt: null },
    })
  }

  async markTaskRead(userId: string, taskId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, taskId, readAt: null },
      data: { readAt: new Date() },
    })
  }
}
