import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('社团分类')
@Controller('club-categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '获取所有社团分类' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '创建社团分类（管理员）' })
  async create(@Body() createCategoryDto: { name: string; description?: string }) {
    return this.categoriesService.create(createCategoryDto.name, createCategoryDto.description);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新社团分类（管理员）' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: { name: string; description?: string },
  ) {
    return this.categoriesService.update(
      id,
      updateCategoryDto.name,
      updateCategoryDto.description,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除社团分类（管理员）' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
