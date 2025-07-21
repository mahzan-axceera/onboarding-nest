import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TypesenseService } from 'src/typesense/typesense.service';
import { CreatePostDto } from '../controllers/posts/dto/create-post.dto';
import { UpdatePostDto } from '../controllers/posts/dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService, private typesense: TypesenseService) { }

  async create(dto: CreatePostDto, userId: string) {
    try {
      // Create the post
      const post = await this.prisma.post.create({
        data: {
          title: dto.title,
          bodyText: dto.bodyText,
          imageUrl: dto.imageUrl,
          authorId: userId,
        },
      });

      try {
        // Index to Typesense separately
        await this.typesense.indexPost({
          ...post,
          createdAt: new Date(post.createdAt).getTime(),
        });
      } catch (typesenseErr) {
        // Log this somewhere instead of throwing if search is non-critical
        console.error('Typesense index failed', typesenseErr);
      }

      return post;
    } catch (err) {
      // Default to 500 for unknown errors
      console.error('Post creation failed:', err);
      throw new InternalServerErrorException('Failed to create post');
    }
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

  async update(id: string, dto: UpdatePostDto, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new UnauthorizedException('Not authorized to update this post');

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: dto,
    });
    await this.typesense.indexPost({
      ...updatedPost,
      createdAt: new Date(updatedPost.createdAt).getTime(),
    });
    return updatedPost;
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new UnauthorizedException('Not authorized to delete this post');

    await this.prisma.post.delete({ where: { id } });
    await this.typesense.deletePost(id);
  }

  async search(query: string) {
    return this.typesense.searchPosts(query);
  }
}