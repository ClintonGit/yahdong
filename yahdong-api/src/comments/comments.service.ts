import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common'
import DOMPurify, { type Config as DOMPurifyConfig } from 'isomorphic-dompurify'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateCommentDto } from './dto/create-comment.dto'

/**
 * Whitelist for rich-text comment bodies authored via TipTap.
 * - mention nodes: `<span data-type="mention" data-id="..." data-label="..." data-mention-suggestion-char="@|#">`
 * - inline links auto-promoted to target=_blank rel=noopener
 */
const SANITIZE_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'code', 'a', 'span', 'img', 'ul', 'ol', 'li',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt',
    'data-type', 'data-id', 'data-label', 'data-mention-suggestion-char',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
}

const MENTION_USER_REGEX =
  /<span\b[^>]*\bdata-type=["']mention["'][^>]*\bdata-mention-suggestion-char=["']@["'][^>]*\bdata-id=["']([^"']+)["'][^>]*>/gi
// Same node — id can appear before the suggestion-char attribute.
const MENTION_USER_REGEX_ALT =
  /<span\b[^>]*\bdata-type=["']mention["'][^>]*\bdata-id=["']([^"']+)["'][^>]*\bdata-mention-suggestion-char=["']@["'][^>]*>/gi

/**
 * Force every <a> to open in a new tab with safe rel.
 * (DOMPurify hooks aren't easily configurable per-call, so do a post-pass.)
 */
function hardenLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    let cleaned = attrs
      .replace(/\s+target=["'][^"']*["']/gi, '')
      .replace(/\s+rel=["'][^"']*["']/gi, '')
    if (!cleaned.startsWith(' ') && cleaned.length > 0) cleaned = ' ' + cleaned
    return `<a${cleaned} target="_blank" rel="noopener noreferrer">`
  })
}

/** Extract distinct user-mention IDs from a sanitized HTML body. */
function extractMentionedUserIds(html: string): Set<string> {
  const ids = new Set<string>()
  const collect = (re: RegExp) => {
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(html)) !== null) ids.add(m[1])
  }
  collect(MENTION_USER_REGEX)
  collect(MENTION_USER_REGEX_ALT)
  return ids
}

/**
 * Plain-text preview from HTML — used for email body and notification text.
 * Strips tags, decodes a few common entities, collapses whitespace.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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

    // Detect rich-text (TipTap) vs legacy markdown by leading `<`.
    const rawBody = dto.body ?? ''
    const isHtml = /^\s*</.test(rawBody)
    const cleanBody = isHtml
      ? hardenLinks(DOMPurify.sanitize(rawBody, SANITIZE_CONFIG))
      : rawBody

    const comment = await this.prisma.comment.create({
      data: { taskId, userId, body: cleanBody, imageUrl: dto.imageUrl },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })

    // ── Mention extraction ────────────────────────────────────────────
    // For HTML bodies: parse data-id from mention spans (precise).
    // For legacy markdown bodies: fall back to `@<name>` substring match.
    const mentionedUserIds = isHtml ? extractMentionedUserIds(cleanBody) : null

    if (cleanBody) {
      const members = await this.prisma.projectMember.findMany({
        where: { projectId: task.projectId },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      const notifications: { userId: string; taskId: string; commentId: string; type: string; body: string }[] = []
      const mentionedMembers: { id: string; name: string; email: string }[] = []

      for (const m of members) {
        if (m.userId === userId) continue
        const matched = mentionedUserIds
          ? mentionedUserIds.has(m.userId)
          : cleanBody.includes(`@${m.user.name}`)
        if (matched) {
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
        // SSE push so subscribers don't wait for the polling tick.
        this.notifications.publishMany(
          notifications.map((n) => n.userId),
          { type: 'mention', data: { taskId, commentId: comment.id } },
        )
        // Email body = plain-text version of the (already-sanitized) HTML.
        const emailBody = isHtml ? htmlToText(cleanBody) : cleanBody
        for (const target of mentionedMembers) {
          void this.email
            .sendCommentMention({
              mentionedName: target.name,
              mentionedEmail: target.email,
              mentionerName: comment.user.name,
              taskTitle: task.title,
              commentBody: emailBody,
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
