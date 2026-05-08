import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'
import { finalize } from 'rxjs/operators'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Payload pushed onto a user's SSE channel. Frontend treats every event as a
 * "something changed" hint and re-fetches the notifications list — we
 * intentionally keep the payload tiny and free of PII so it's safe over the
 * wire even if the connection is sniffed by something with limited TLS.
 */
export interface NotificationStreamEvent {
  type: 'mention' | 'assign' | 'invite' | 'ping'
  data?: Record<string, unknown>
}

interface SseMessage {
  data: NotificationStreamEvent
  type?: string
  id?: string
}

interface UserChannel {
  subject: Subject<SseMessage>
  /** Active subscriber count (one per open EventSource for the user). */
  refCount: number
}

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name)
  private readonly streams = new Map<string, UserChannel>()

  constructor(private prisma: PrismaService) {}

  // ── DB queries (unchanged) ───────────────────────────────────────────────
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

  // ── SSE channel ──────────────────────────────────────────────────────────
  /**
   * Subscribe a single EventSource to its user's notification channel.
   * Multiple tabs for the same user share one Subject (fan-out via rxjs).
   * The channel is removed from the Map once every tab disconnects, so the
   * Map cannot grow unboundedly across login sessions.
   */
  subscribe(userId: string): Observable<SseMessage> {
    let channel = this.streams.get(userId)
    if (!channel) {
      channel = { subject: new Subject<SseMessage>(), refCount: 0 }
      this.streams.set(userId, channel)
    }
    channel.refCount += 1
    const ch = channel

    return ch.subject.asObservable().pipe(
      finalize(() => {
        ch.refCount -= 1
        if (ch.refCount <= 0) {
          ch.subject.complete()
          // Only delete if we are still the registered channel (defensive
          // against race with a freshly-resubscribed user).
          if (this.streams.get(userId) === ch) {
            this.streams.delete(userId)
          }
        }
      }),
    )
  }

  /**
   * Push an event to a user's channel if anyone is currently listening.
   * No-op when the user has no open EventSource — frontends fall back to
   * the polling cadence in that case.
   */
  publish(userId: string, event: NotificationStreamEvent): void {
    const channel = this.streams.get(userId)
    if (!channel || channel.refCount <= 0) return
    try {
      channel.subject.next({ data: event })
    } catch (err) {
      this.logger.warn(
        `Failed to push SSE event to user=${userId}: ${(err as Error).message}`,
      )
    }
  }

  /** Bulk helper — used by callers that resolve a list of recipient ids. */
  publishMany(userIds: Iterable<string>, event: NotificationStreamEvent): void {
    for (const uid of userIds) this.publish(uid, event)
  }

  onModuleDestroy() {
    // Cleanly close every active channel on shutdown so connected clients
    // receive a proper end-of-stream rather than a TCP RST.
    for (const channel of this.streams.values()) {
      channel.subject.complete()
    }
    this.streams.clear()
  }
}
