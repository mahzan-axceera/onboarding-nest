import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TypesenseService } from 'src/typesense/typesense.service';
import { CreatePostDto } from '../controllers/posts/dto/create-post.dto';
import { UpdatePostDto } from '../controllers/posts/dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from 'src/controllers/auth/dto/register.dto';
import { SupabaseService } from './supabase.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private typesense: TypesenseService,
    private supabase: SupabaseService,
  ) {}

  async create(
    dto: CreatePostDto,
    file: Express.Multer.File | undefined,
    userId: number,
  ) {
    try {
      let imageUrl: string | undefined;
      if (file) {
        // console.log('Uploading image:', { file, size: file.size }); // Debug
        const { data, error } = await this.supabase
          .getClient()
          .storage.from('dino-feed')
          .upload(`${userId}/${file.originalname}`, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });
        if (error) {
          console.error('Supabase upload error:', error); // Debug
          throw new InternalServerErrorException(
            `Failed to upload image to Supabase: ${error.message}`,
          );
        }
        // console.log('Supabase upload response:', data); // Debug
        imageUrl = this.supabase
          .getClient()
          .storage.from('dino-feed')
          .getPublicUrl(`${userId}/${file.originalname}`).data.publicUrl;
      }
      const post = await this.prisma.post.create({
        data: {
          title: dto.title,
          bodyText: dto.bodyText,
          imageUrl,
          authorId: userId,
        },
      });

      try {
        // Index to Typesense separately
        await this.typesense.indexPost({
          ...post,
          id: post.id.toString(), // Ensure id is a string for Typesense
          imageUrl: post.imageUrl || '',
          createdAt: new Date(post.createdAt).getTime(),
        });
      } catch (typesenseErr) {
        // Log this somewhere instead of throwing if search is non-critical
        console.error('Typesense index failed', typesenseErr);
      }

      return post;
    } catch (err) {
      console.error('Post creation failed:', err);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  findAll(page: number, limit: number, userId: number, userRole: Role) {
    const skip = (page - 1) * limit;
    const where = userRole === Role.ADMIN ? {} : { authorId: userId };
    return this.prisma.post.findMany({
      where,
      skip,
      take: limit,
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(
    id: number,
    dto: UpdatePostDto,
    file: Express.Multer.File | undefined,
    userId: number,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId)
      throw new UnauthorizedException('Not authorized to update this post');

    let imageUrl = post.imageUrl;
    if (file) {
      const { data, error } = await this.supabase
        .getClient()
        .storage.from('dino-feed')
        .upload(`${userId}/${file.originalname}`, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
      if (error)
        throw new InternalServerErrorException(
          'Failed to upload image to Supabase',
        );
      imageUrl = this.supabase
        .getClient()
        .storage.from('dino-feed')
        .getPublicUrl(`${userId}/${file.originalname}`).data.publicUrl;
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        imageUrl,
      },
    });
    await this.typesense.indexPost({
      ...updatedPost,
      id: updatedPost.id.toString(),
      imageUrl: updatedPost.imageUrl || '',
      createdAt: new Date(updatedPost.createdAt).getTime(),
    });
    return updatedPost;
  }

  async remove(id: number, userId: number, userRole: Role) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new UnauthorizedException('Not authorized to delete this post');
    }

    try {
      await this.prisma.post.delete({ where: { id } });
    } catch (e) {
      throw new InternalServerErrorException('Failed to delete post from DB');
    }

    try {
      await this.typesense.deletePost(id.toString());
    } catch (e) {
      console.warn(`⚠️ Failed to delete post ${id} from Typesense`, e);
      // Not fatal — proceed silently or log it
    }
  }

  async search(query: string) {
    return this.typesense.searchPosts(query);
  }
}
