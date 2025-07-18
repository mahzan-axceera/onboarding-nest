import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {

  @ApiPropertyOptional({ example: 'Updated Post title' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ example: 'Updated Post content' })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional({ example: 'Updated Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string
}