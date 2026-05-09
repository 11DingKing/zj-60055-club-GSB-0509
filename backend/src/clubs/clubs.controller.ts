import { Controller, Get, Param, Put, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('社团')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '获取社团列表' })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.clubsService.findAll(categoryId, search);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取社团详情' })
  async findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新社团信息' })
  async update(
    @Param('id') id: string,
    @Body() updateClubDto: any,
    @Request() req,
  ) {
    return this.clubsService.update(id, updateClubDto, req.user);
  }
}
