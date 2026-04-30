import { IsString, MinLength } from 'class-validator'
export class CreateStatusDto {
  @IsString() @MinLength(1) name: string
  @IsString() color: string
}
