import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PostsService } from '../../services/posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all posts',
    description: 'Retrieve a paginated list of all posts with their authors.',
  })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10'
  ) {
    return this.postsService.findAll(+page, +limit);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.postsService.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}