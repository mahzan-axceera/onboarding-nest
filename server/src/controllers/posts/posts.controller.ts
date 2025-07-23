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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from '../../services/posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Protect POST /posts
  @ApiOperation({ summary: 'Create a new post (authenticated users only)' })
  create(@Body() dto: CreatePostDto, @Request() req) {
    return this.postsService.create(dto, req.user.sub);
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
  @ApiOperation({ summary: 'Update a post (authenticated users only)' })
  update(@Param('id') id: number, @Body() dto: UpdatePostDto, @Request() req) {
    return this.postsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a post (Creator & Admin only)' })
  remove(@Param('id') id: number, @Request() req) {
    return this.postsService.remove(id, req.user.sub, req.user.role);
  }
}
