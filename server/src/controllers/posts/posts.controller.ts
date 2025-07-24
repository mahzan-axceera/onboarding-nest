import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from '../../services/posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Protect POST /posts
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  @ApiOperation({ summary: 'Create a new post (authenticated users only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Post title' },
        bodyText: { type: 'string', example: 'Post content' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title'],
    },
  })
  create(
    @Body() dto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.postsService.create(dto, file, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated posts (Admins see all, Users see own)',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Request() req,
  ) {
    return this.postsService.findAll(
      +page,
      +limit,
      req.user.sub,
      req.user.role,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search posts' })
  search(@Query('q') q: string) {
    return this.postsService.search(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  findOne(@Param('id') id: number) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  @ApiOperation({ summary: 'Update a post (authenticated users only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Post title' },
        bodyText: { type: 'string', example: 'Updated Post content' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title'],
    },
  })
  update(
    @Param('id') id: number,
    @Body() dto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.postsService.update(id, dto, file, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a post (Creator & Admin only)' })
  remove(@Param('id') id: number, @Request() req) {
    return this.postsService.remove(id, req.user.sub, req.user.role);
  }
}
