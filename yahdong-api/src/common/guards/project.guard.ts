import {
  Injectable, CanActivate, ExecutionContext,
  NotFoundException, ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { ProjectRole } from '@prisma/client'

const ROLE_ORDER: ProjectRole[] = ['viewer', 'member', 'owner']

@Injectable()
export class ProjectGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const userId: string = req.user?.sub

    let projectId: string | undefined = req.params.projectId ?? req.params.id

    if (!projectId && req.params.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: req.params.taskId },
        select: { projectId: true },
      })
      projectId = task?.projectId ?? undefined
    }

    if (!projectId && req.params.statusId) {
      const status = await this.prisma.taskStatus.findUnique({
        where: { id: req.params.statusId },
        select: { projectId: true },
      })
      projectId = status?.projectId ?? undefined
    }

    if (!projectId && req.params.itemId) {
      const item = await this.prisma.checklistItem.findUnique({
        where: { id: req.params.itemId },
        include: { task: { select: { projectId: true } } },
      })
      projectId = item?.task.projectId ?? undefined
    }

    if (!projectId || !userId) throw new ForbiddenException()

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (!membership) throw new NotFoundException('Project not found')

    req.projectMember = membership

    const required = this.reflector.getAllAndOverride<ProjectRole[]>(ROLES_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ])
    if (!required) return true

    const userLevel = ROLE_ORDER.indexOf(membership.role)
    const minLevel = Math.min(...required.map((r) => ROLE_ORDER.indexOf(r)))
    if (userLevel < minLevel) throw new ForbiddenException('Insufficient role')
    return true
  }
}
