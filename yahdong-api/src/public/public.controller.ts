import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ProjectsService } from '../projects/projects.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator'

@Controller()
export class PublicController {
  constructor(private projects: ProjectsService) {}

  @Get('b/:shareToken')
  getPublicBoard(@Param('shareToken') shareToken: string) {
    return this.projects.getPublicBoard(shareToken)
  }

  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.projects.getInvite(token)
  }

  @Post('invite/:token/accept')
  @UseGuards(JwtAuthGuard)
  acceptInvite(@Param('token') token: string, @CurrentUser() user: JwtPayload) {
    return this.projects.acceptInvite(token, user.sub)
  }
}
