import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, Role } from 'src/controllers/auth/dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from 'src/controllers/auth/dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        // Check if this is the first user
        const userCount = await this.prisma.user.count();

        const role = userCount === 0 ? Role.ADMIN : Role.CUSTOMER;

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                password: hashedPassword,
                role,
            },
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshToken = await this.generateRefreshToken(user.id);
        return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
    }

    async generateRefreshToken(userId: number) {
        // Clean up expired tokens
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                expiresAt: { lte: new Date() }, // Delete tokens that are expired
            },
        });

        // Limit to 5 refresh tokens per user
        const MAX_TOKENS = this.configService.get<number>('JWT_MAX_REFRESH_TOKENS') || 5;
        const existingTokens = await this.prisma.refreshToken.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }, // Oldest first
        });

        if (existingTokens.length >= MAX_TOKENS) {
            // Delete the oldest token(s)
            const tokensToDelete = existingTokens.slice(0, existingTokens.length - MAX_TOKENS + 1);
            await this.prisma.refreshToken.deleteMany({
                where: { id: { in: tokensToDelete.map((token) => token.id) } },
            });
        }

        // Create new refresh token
        const token = this.jwtService.sign(
            { sub: userId },
            {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
            },
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await this.prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });

        return token;
    }

    async refreshAccessToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const storedToken = await this.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user) throw new UnauthorizedException('User not found');

            const accessToken = this.jwtService.sign({
                sub: user.id,
                email: user.email,
                role: user.role,
            });

            return { accessToken };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
