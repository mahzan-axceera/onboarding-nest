import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user and return tokens' })
  async login(@Body() dto: LoginDto, @Response() res) {
    const result = await this.authService.login(dto);
    // Set refreshToken as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Required for secure storage
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response without refreshToken in body
    return res.json({
      status: true,
      statusCode: HttpStatus.OK,
      path: '/auth/login',
      message: 'Success',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      timestamp: new Date().toISOString(),
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Request() req, @Response() res) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        path: '/auth/refresh',
        message: 'No refresh token provided',
        timestamp: new Date().toISOString(),
      });
    }
    const result = await this.authService.refreshAccessToken(refreshToken);
    return res.json({
      status: true,
      statusCode: HttpStatus.OK,
      path: '/auth/refresh',
      message: 'Success',
      data: { accessToken: result.accessToken },
      timestamp: new Date().toISOString(),
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout a user by invalidating refresh token' })
  async logout(@Request() req, @Response() res) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/auth/logout',
        message: 'No refresh token provided',
        timestamp: new Date().toISOString(),
      });
    }
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    return res.json({
      status: true,
      statusCode: HttpStatus.OK,
      path: '/auth/logout',
      message: 'Logged out successfully',
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString(),
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user details' })
  getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }
}
