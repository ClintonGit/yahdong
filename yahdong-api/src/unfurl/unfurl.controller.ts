import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { UnfurlService } from './unfurl.service'

@Controller('unfurl')
@UseGuards(JwtAuthGuard)
// Stricter throttle than the global default — unfurl makes outbound requests.
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class UnfurlController {
  constructor(private readonly unfurl: UnfurlService) {}

  @Get()
  async get(@Query('url') url: string) {
    return this.unfurl.fetch(url)
  }
}
