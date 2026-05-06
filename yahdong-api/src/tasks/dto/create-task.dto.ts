import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { TaskPriority } from '@prisma/client'
export class CreateTaskDto {
  @IsString() @MinLength(1) title: string
  @IsOptional() @IsString() description?: string
  @IsString() statusId: string
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority
  @IsOptional() @IsArray() @IsString({ each: true }) assigneeIds?: string[]
  @IsOptional() dueDate?: Date
}
