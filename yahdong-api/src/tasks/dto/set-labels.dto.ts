import { IsArray, IsString } from 'class-validator'
export class SetLabelsDto {
  @IsArray() @IsString({ each: true }) labelIds: string[]
}
