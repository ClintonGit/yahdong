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
    const projectId: string = req.params.projectId ?? req.params.id

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
