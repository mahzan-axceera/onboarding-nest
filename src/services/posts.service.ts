import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from '../controllers/posts/dto/create-post.dto';
import { UpdatePostDto } from '../controllers/posts/dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) { }

  create(dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        content: dto.content,
        authorId: dto.authorId,
      },
    });
  }

  findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    return this.prisma.post.findMany({
      skip,
      take: limit,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  update(id: string, dto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}