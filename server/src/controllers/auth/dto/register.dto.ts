import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'CUSTOMER', enum: Role })
  @IsEnum(Role)
  role?: Role;
}