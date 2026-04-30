import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { InviteMemberDto } from './dto/invite-member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'

const DEFAULT_STATUSES = [
  { name: 'Backlog', color: '#94A3B8', order: 1000 },
  { name: 'In Progress', color: '#F59E0B', order: 2000 },
  { name: 'Done', color: '#22C55E', order: 3000 },
]

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: { _count: { select: { members: true } } },
        },
      },
    })
    return memberships.map((m) => ({ ...m.project, myRole: m.role }))
  }

  async create(userId: string, dto: CreateProjectDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // need orgId — create personal org per user if none
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

  async inviteMember(projectId: string, dto: InviteMemberDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new NotFoundException('User not found')

    const exists = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    })
    if (exists) throw new ConflictException('Already a member')

    return this.prisma.projectMember.create({
      data: { projectId, userId: user.id, role: dto.role },
      include: { user: { select: { id: true, name: true, avatar: true } } },
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
}
