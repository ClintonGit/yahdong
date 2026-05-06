import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { InviteMemberDto } from './dto/invite-member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { CreateLabelDto } from './dto/create-label.dto'
import { UpdateLabelDto } from './dto/update-label.dto'

const DEFAULT_STATUSES = [
  { name: 'Backlog', color: '#94A3B8', order: 1000 },
  { name: 'In Progress', color: '#F59E0B', order: 2000 },
  { name: 'Done', color: '#22C55E', order: 3000 },
]

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: { _count: { select: { members: true } } },
        },
      },
    })
    return memberships.map((m) => ({ ...m.project, myRole: m.role, starred: m.starred }))
  }

  async create(userId: string, dto: CreateProjectDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    let org = await this.prisma.organization.findFirst({
      where: { members: { some: { userId, role: 'owner' } } },
    })
    if (!org) {
      org = await this.prisma.organization.create({
        data: {
          name: `${userId}'s workspace`,
          slug: userId,
          members: { create: { userId, role: 'owner' } },
        },
      })
    }

    const project = await this.prisma.project.create({
      data: {
        orgId: org.id,
        name: dto.name,
        slug: `${slug}-${Date.now()}`,
        description: dto.description,
        color: dto.color ?? '#E8A030',
        members: { create: { userId, role: 'owner' } },
        statuses: { create: DEFAULT_STATUSES },
      },
    })
    return project
  }

  async findOne(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        statuses: { orderBy: { order: 'asc' } },
      },
    })
    if (!project) throw new NotFoundException()
    return project
  }

  async update(projectId: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id: projectId }, data: dto })
  }

  async remove(projectId: string) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    })
  }

  async inviteMember(projectId: string, inviterId: string, dto: InviteMemberDto) {
    const [invitee, inviter, project] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { id: inviterId }, select: { name: true } }),
      this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } }),
    ])
    if (!invitee) throw new NotFoundException('User not found')

    const exists = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invitee.id } },
    })
    if (exists) throw new ConflictException('Already a member')

    const pendingInvite = await this.prisma.projectInvite.findFirst({
      where: { projectId, email: dto.email, usedAt: null, expiresAt: { gt: new Date() } },
    })
    if (pendingInvite) throw new ConflictException('Invite already sent')

    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.prisma.projectInvite.create({
      data: { projectId, token, email: dto.email, role: dto.role, expiresAt },
    })

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const inviteLink = `${frontendUrl}/invite/${token}`

    if (inviter && project) {
      void this.email.sendProjectInvite({
        inviteeName: invitee.name,
        inviteeEmail: invitee.email,
        inviterName: inviter.name,
        projectName: project.name,
        projectId: project.id,
        inviteLink,
      })
    }

    return { message: 'Invite sent', email: dto.email }
  }

  async getProjectInvites(projectId: string) {
    return this.prisma.projectInvite.findMany({
      where: { projectId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    })
  }

  async cancelInvite(projectId: string, inviteId: string) {
    await this.prisma.projectInvite.delete({
      where: { id: inviteId, projectId },
    })
  }

  async updateMember(projectId: string, userId: string, dto: UpdateMemberDto, currentUserId: string) {
    if (userId === currentUserId) throw new BadRequestException('Cannot change your own role')
    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: dto.role },
    })
  }

  async removeMember(projectId: string, userId: string) {
    const owners = await this.prisma.projectMember.count({
      where: { projectId, role: 'owner' },
    })
    const target = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (target?.role === 'owner' && owners <= 1) {
      throw new BadRequestException('Cannot remove the last owner')
    }
    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    })
  }

  // ── Members list (for assignee picker) ──────────────────────────────────
  async getMembers(projectId: string) {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
    })
    return members.map((m) => ({ ...m.user, role: m.role }))
  }

  // ── Star / Unstar ────────────────────────────────────────────────────────
  async toggleStar(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (!member) throw new NotFoundException()
    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { starred: !member.starred },
      select: { starred: true },
    })
  }

  // ── Invite link ──────────────────────────────────────────────────────────
  async generateInviteLink(projectId: string) {
    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const invite = await this.prisma.projectInvite.create({
      data: { projectId, token, expiresAt },
    })
    return { token: invite.token, expiresAt: invite.expiresAt }
  }

  async getInvite(token: string) {
    const invite = await this.prisma.projectInvite.findUnique({
      where: { token },
      include: { project: { select: { id: true, name: true, color: true } } },
    })
    if (!invite) throw new NotFoundException('Invite not found')
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired')
    if (invite.usedAt) throw new BadRequestException('Invite already used')
    return invite
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInvite(token)

    const exists = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: invite.projectId, userId } },
    })
    if (exists) throw new ConflictException('Already a member')

    const [member] = await this.prisma.$transaction([
      this.prisma.projectMember.create({
        data: { projectId: invite.projectId, userId, role: invite.role },
      }),
      this.prisma.projectInvite.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ])
    return { projectId: invite.projectId, role: member.role }
  }

  // ── Public share ─────────────────────────────────────────────────────────
  async toggleShare(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { isPublic: true, shareToken: true },
    })
    if (!project) throw new NotFoundException()

    if (!project.isPublic) {
      const shareToken = project.shareToken ?? randomBytes(16).toString('hex')
      return this.prisma.project.update({
        where: { id: projectId },
        data: { isPublic: true, shareToken },
        select: { isPublic: true, shareToken: true },
      })
    } else {
      return this.prisma.project.update({
        where: { id: projectId },
        data: { isPublic: false },
        select: { isPublic: true, shareToken: true },
      })
    }
  }

  async getPublicBoard(shareToken: string) {
    const project = await this.prisma.project.findUnique({
      where: { shareToken },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        tasks: {
          include: {
            assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            status: true,
            labels: { include: { label: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    })
    if (!project || !project.isPublic) throw new NotFoundException()
    return project
  }

  // ── Labels ───────────────────────────────────────────────────────────────
  async getLabels(projectId: string) {
    return this.prisma.label.findMany({ where: { projectId }, orderBy: { name: 'asc' } })
  }

  async createLabel(projectId: string, dto: CreateLabelDto) {
    return this.prisma.label.create({ data: { ...dto, projectId } })
  }

  async updateLabel(labelId: string, dto: UpdateLabelDto) {
    return this.prisma.label.update({ where: { id: labelId }, data: dto })
  }

  async removeLabel(labelId: string) {
    await this.prisma.label.delete({ where: { id: labelId } })
  }
}
