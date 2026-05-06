import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: Transporter

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
      tls: { rejectUnauthorized: false },
    })
  }

  private get from() {
    return this.config.get<string>('EMAIL_FROM', 'อย่าดอง <info@commsk.dev>')
  }

  private get appUrl() {
    return this.config.get<string>('APP_URL', 'https://yahdong.commsk.dev')
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html })
      this.logger.log(`Email sent → ${to} | ${subject}`)
    } catch (err) {
      this.logger.error(`Email failed → ${to}: ${(err as Error).message}`)
    }
  }

  async sendTaskAssigned(opts: {
    assigneeName: string
    assigneeEmail: string
    assignerName: string
    taskTitle: string
    projectName: string
    projectId: string
  }) {
    const { assigneeName, assigneeEmail, assignerName, taskTitle, projectName, projectId } = opts
    const taskUrl = `${this.appUrl}/projects/${projectId}`
    await this.send(
      assigneeEmail,
      `🎯 มีงานมอบหมายให้คุณ — ${taskTitle}`,
      `<div style="font-family:IBM Plex Sans Thai,sans-serif;max-width:480px;margin:0 auto;background:#faf9f7;padding:32px;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#E8A030">อย่าดอง</span>
          <span style="font-size:20px;margin-left:6px">🌿</span>
        </div>
        <p style="color:#1a1a2e;font-size:15px">สวัสดีค่ะ <strong>${assigneeName}</strong>,</p>
        <p style="color:#1a1a2e;font-size:15px">
          <strong>${assignerName}</strong> ได้มอบหมายงาน
          <strong style="color:#E8A030">"${taskTitle}"</strong>
          ให้คุณในโปรเจค <strong>${projectName}</strong>
        </p>
        <a href="${taskUrl}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#E8A030;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          ดูงาน →
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">
          อย่าดอง — Kanban สำหรับทีม 🌿
        </p>
      </div>`,
    )
  }

  async sendCommentMention(opts: {
    mentionedName: string
    mentionedEmail: string
    mentionerName: string
    taskTitle: string
    commentBody: string
    projectId: string
  }) {
    const { mentionedName, mentionedEmail, mentionerName, taskTitle, commentBody, projectId } = opts
    const taskUrl = `${this.appUrl}/projects/${projectId}`
    await this.send(
      mentionedEmail,
      `💬 ${mentionerName} แท็กคุณใน ${taskTitle}`,
      `<div style="font-family:IBM Plex Sans Thai,sans-serif;max-width:480px;margin:0 auto;background:#faf9f7;padding:32px;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#E8A030">อย่าดอง</span>
          <span style="font-size:20px;margin-left:6px">🌿</span>
        </div>
        <p style="color:#1a1a2e;font-size:15px">สวัสดีค่ะ <strong>${mentionedName}</strong>,</p>
        <p style="color:#1a1a2e;font-size:15px">
          <strong>${mentionerName}</strong> แท็กคุณในงาน <strong style="color:#E8A030">"${taskTitle}"</strong>
        </p>
        <blockquote style="border-left:3px solid #4A7C5E;padding:12px 16px;background:#f0f7f4;border-radius:0 8px 8px 0;margin:16px 0;color:#4A7C5E;font-style:italic">
          ${commentBody}
        </blockquote>
        <a href="${taskUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4A7C5E;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          ดู Comment →
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">
          อย่าดอง — Kanban สำหรับทีม 🌿
        </p>
      </div>`,
    )
  }

  async sendProjectInvite(opts: {
    inviteeName: string
    inviteeEmail: string
    inviterName: string
    projectName: string
    projectId: string
    inviteLink?: string
  }) {
    const { inviteeName, inviteeEmail, inviterName, projectName, projectId, inviteLink } = opts
    const actionUrl = inviteLink ?? `${this.appUrl}/projects/${projectId}`
    await this.send(
      inviteeEmail,
      `🌿 ${inviterName} เชิญคุณเข้าร่วม ${projectName}`,
      `<div style="font-family:IBM Plex Sans Thai,sans-serif;max-width:480px;margin:0 auto;background:#faf9f7;padding:32px;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#E8A030">อย่าดอง</span>
          <span style="font-size:20px;margin-left:6px">🌿</span>
        </div>
        <p style="color:#1a1a2e;font-size:15px">สวัสดีค่ะ <strong>${inviteeName}</strong>,</p>
        <p style="color:#1a1a2e;font-size:15px">
          <strong>${inviterName}</strong> เชิญคุณเข้าร่วมโปรเจค
          <strong style="color:#E8A030">"${projectName}"</strong>
        </p>
        <a href="${actionUrl}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#E8A030;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          รับคำเชิญ →
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">
          อย่าดอง — Kanban สำหรับทีม 🌿
        </p>
      </div>`,
    )
  }
}
