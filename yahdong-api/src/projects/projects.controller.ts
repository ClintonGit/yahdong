import {
  Body, Controller, Delete, Get, HttpCode, Param,
  Patch, Post, UseGuards,
} from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { InviteMemberDto } from './dto/invite-member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { CreateLabelDto } from './dto/create-label.dto'
import { UpdateLabelDto } from './dto/update-label.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { ProjectGuard } from '../common/guards/project.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator'

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projects.findAll(user.sub)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.sub, dto)
  }

  @Get(':id')
  @UseGuards(ProjectGuard)
  findOne(@Param('id') id: string) {
    return this.projects.findOne(id)
  }

  @Patch(':id')
  @UseGuards(ProjectGuard)
  @Roles('owner')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(ProjectGuard)
  @Roles('owner')
  remove(@Param('id') id: string) {
    return this.projects.remove(id)
  }

  // ── Members ──────────────────────────────────────────────────────────────
  @Get(':id/members')
  @UseGuards(ProjectGuard)
  getMembers(@Param('id') id: string) {
    return this.projects.getMembers(id)
  }

  @Post(':id/members')
  @UseGuards(ProjectGuard)
  @Roles('owner')
  inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.inviteMember(id, user.sub, dto)
  }

  @Patch(':id/members/:userId')
  @UseGuards(ProjectGuard)
  @Roles('owner')
  updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.updateMember(id, userId, dto, user.sub)
  }

  @Delete(':id/members/:userId')
  @HttpCode(204)
  @UseGuards(ProjectGuard)
  @Roles('owner')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projects.removeMember(id, userId)
  }

  // ── Pending Invites ──────────────────────────────────────────────────────
  @Get(':id/invites')
  @UseGuards(ProjectGuard)
  @Roles('owner')
  getInvites(@Param('id') id: string) {
    return this.projects.getProjectInvites(id)
  }

  @Delete(':id/invites/:inviteId')
  @HttpCode(204)
  @UseGuards(ProjectGuard)
  @Roles('owner')
  cancelInvite(@Param('id') id: string, @Param('inviteId') inviteId: string) {
    return this.projects.cancelInvite(id, inviteId)
  }

  // ── Star ─────────────────────────────────────────────────────────────────
  @Patch(':id/star')
  @UseGuards(ProjectGuard)
  toggleStar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projects.toggleStar(id, user.sub)
  }

  // ── Invite link ──────────────────────────────────────────────────────────
  @Post(':id/invite-link')
  @UseGuards(ProjectGuard)
  @Roles('owner')
  generateInviteLink(@Param('id') id: string) {
    return this.projects.generateInviteLink(id)
  }

  // ── Public share ─────────────────────────────────────────────────────────
  @Patch(':id/share')
  @UseGuards(ProjectGuard)
  @Roles('owner')
  toggleShare(@Param('id') id: string) {
    return this.projects.toggleShare(id)
  }

  // ── Labels ───────────────────────────────────────────────────────────────
  @Get(':id/labels')
  @UseGuards(ProjectGuard)
  getLabels(@Param('id') id: string) {
    return this.projects.getLabels(id)
  }

  @Post(':id/labels')
  @UseGuards(ProjectGuard)
  createLabel(@Param('id') id: string, @Body() dto: CreateLabelDto) {
    return this.projects.createLabel(id, dto)
  }

  @Patch('labels/:labelId')
  updateLabel(@Param('labelId') labelId: string, @Body() dto: UpdateLabelDto) {
    return this.projects.updateLabel(labelId, dto)
  }

  @Delete('labels/:labelId')
  @HttpCode(204)
  removeLabel(@Param('labelId') labelId: string) {
    return this.projects.removeLabel(labelId)
  }
}
