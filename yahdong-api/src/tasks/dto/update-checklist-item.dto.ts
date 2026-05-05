import { IsBoolean, IsOptional, IsString } from 'class-validator'
export class UpdateChecklistItemDto {
  @IsOptional() @IsString() text?: string
  @IsOptional() @IsBoolean() checked?: boolean
}
