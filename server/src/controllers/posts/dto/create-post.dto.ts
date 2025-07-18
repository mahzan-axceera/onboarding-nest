import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {

  @ApiProperty({ example: 'Post title' })
  @IsString()
  title: string

  @ApiPropertyOptional({ example: 'Post content' })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional({ example: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string

  @ApiProperty({ example: 'uuid-of-author' })
  @IsString()
  authorId: string;


}