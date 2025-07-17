import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'This is my first post' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'uuid-of-author' })
  @IsString()
  authorId: string;
}