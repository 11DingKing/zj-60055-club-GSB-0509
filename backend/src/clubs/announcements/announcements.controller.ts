import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('社团公告')
@Controller('clubs/:clubId/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '获取社团公告列表' })
  async findByClub(@Param('clubId') clubId: string) {
    return this.announcementsService.findByClub(clubId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取公告详情' })
  async findOne(@Param('clubId') clubId: string, @Param('id') id: string) {
    return this.announcementsService.findOne(clubId, id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '发布社团公告' })
  async create(
    @Param('clubId') clubId: string,
    @Body() createAnnouncementDto: any,
    @Request() req,
  ) {
    return this.announcementsService.create(clubId, req.user.id, createAnnouncementDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新社团公告' })
  async update(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Body() updateAnnouncementDto: any,
    @Request() req,
  ) {
    return this.announcementsService.update(clubId, id, req.user.id, updateAnnouncementDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除社团公告' })
  async remove(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.announcementsService.remove(clubId, id, req.user.id);
  }
}
