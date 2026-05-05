import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateCommentDto {
  @IsString() @IsNotEmpty() body: string
  @IsOptional() @IsString() imageUrl?: string
}
