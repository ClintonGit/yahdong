import { IsArray, IsString } from 'class-validator'
export class ReorderStatusesDto {
  @IsArray() @IsString({ each: true }) orderedIds: string[]
}
