// src/controllers/auth/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from './dto/register.dto';


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
        if (!requiredRoles) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('User role not found');
        }

        // Special handling for DELETE /posts/:id
        if (request.method === 'DELETE' && request.url.includes('/posts/')) {
            const postId = parseInt(request.params.id, 10);
            const post = await this.prisma.post.findUnique({ where: { id: postId } });
            if (!post) throw new ForbiddenException('Post not found');
            if (post.authorId === user.sub || user.role === Role.ADMIN) {
                return true; // Allow if user is the author or an Admin
            }
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient role permissions');
        }

        return true;
    }
}