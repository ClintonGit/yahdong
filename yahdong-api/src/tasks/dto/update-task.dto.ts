import { IsEnum, IsOptional, IsString } from 'class-validator'
import { TaskPriority } from '@prisma/client'
export class UpdateTaskDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() statusId?: string
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority
  @IsOptional() @IsString() assigneeId?: string
  @IsOptional() dueDate?: Date | null
  @IsOptional() @IsString() coverImage?: string | null
}
