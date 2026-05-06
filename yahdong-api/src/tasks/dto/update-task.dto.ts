import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator'
import { TaskPriority } from '@prisma/client'
export class UpdateTaskDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() statusId?: string
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority
  @IsOptional() @IsArray() @IsString({ each: true }) assigneeIds?: string[]
  @IsOptional() startDate?: Date | null
  @IsOptional() dueDate?: Date | null
  @IsOptional() @IsString() coverImage?: string | null
  @IsOptional() @IsString() coverColor?: string | null
}
