import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsUrl()
  avatar?: string
}
