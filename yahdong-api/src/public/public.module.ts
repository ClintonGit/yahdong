import { Module } from '@nestjs/common'
import { PublicController } from './public.controller'
import { ProjectsModule } from '../projects/projects.module'

@Module({
  imports: [ProjectsModule],
  controllers: [PublicController],
})
export class PublicModule {}
