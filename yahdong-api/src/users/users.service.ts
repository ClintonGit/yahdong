import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'

const PUBLIC_SELECT = { id: true, name: true, avatar: true } as const
const PROFILE_SELECT = { id: true, name: true, email: true, avatar: true, createdAt: true } as const

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: PROFILE_SELECT })
  }

  updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: PROFILE_SELECT })
  }

  getPublic(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: PUBLIC_SELECT })
  }
}
