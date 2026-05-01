import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Prisma 7 runtime requires a truthy options object; DATABASE_URL is read from process.env
    super({})
  }

  async onModuleInit() {
    await this.$connect()
  }
}
