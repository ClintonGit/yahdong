import { IsNumber, IsString } from 'class-validator'
export class MoveTaskDto {
  @IsString() statusId: string
  @IsNumber() order: number
}
