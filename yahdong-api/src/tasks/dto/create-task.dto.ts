import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { TaskPriority } from '@prisma/client'
export class CreateTaskDto {
  @IsString() @MinLength(1) title: string
  @IsOptional() @IsString() description?: string
  @IsString() statusId: string
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority
  @IsOptional() @IsString() assigneeId?: string
  @IsOptional() dueDate?: Date
}
