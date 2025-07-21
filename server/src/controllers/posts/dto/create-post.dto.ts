import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {

  @ApiProperty({ example: 'Post title' })
  @IsNotEmpty()
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

}