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

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
          cb(null, true)
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Allowed: jpeg, png, webp, gif`,
            ),
            false,
          )
        }
      },
    }),
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
