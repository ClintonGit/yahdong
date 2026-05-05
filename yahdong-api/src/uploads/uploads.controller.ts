import {
  Controller, Post, UploadedFile,
  UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import * as sharp from 'sharp'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { mkdir, writeFile } from 'fs/promises'

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded')

    const webpBuffer = await (sharp as unknown as typeof sharp.default)(file.buffer)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const filename = `${randomUUID()}.webp`
    const dir = join(process.cwd(), 'uploads')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), webpBuffer)

    return { url: `/uploads/${filename}` }
  }
}
