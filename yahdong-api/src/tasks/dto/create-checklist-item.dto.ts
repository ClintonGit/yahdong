import { IsString } from 'class-validator'
export class CreateChecklistItemDto {
  @IsString() text: string
}
