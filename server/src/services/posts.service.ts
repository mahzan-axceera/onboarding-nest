import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from '../controllers/posts/dto/create-post.dto';
import { UpdatePostDto } from '../controllers/posts/dto/update-post.dto';
import { TypesenseService } from 'src/typesense/typesense.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService, private typesense: TypesenseService) { }

  async create(dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        bodyText: dto.bodyText,
        imageUrl: dto.imageUrl,
        authorId: dto.authorId,
      },
    });
    await this.typesense.indexPost({
      ...post,
      createdAt: new Date(post.createdAt).getTime(),
    });
    return post;
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

  async update(id: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
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

  async remove(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.post.delete({ where: { id } });
    await this.typesense.deletePost(id);
  }

  async search(query: string) {
    return this.typesense.searchPosts(query);
  }
}