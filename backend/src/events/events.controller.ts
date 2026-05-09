import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventStatus } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('活动')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '获取活动列表' })
  async findAll(
    @Query('clubId') clubId?: string,
    @Query('status') status?: EventStatus,
  ) {
    return this.eventsService.findAll(clubId, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取活动详情' })
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.eventsService.findOne(id, userId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建活动' })
  async create(@Body() createEventDto: any, @Request() req) {
    return this.eventsService.create(createEventDto.clubId, req.user.id, createEventDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新活动' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: any,
    @Request() req,
  ) {
    return this.eventsService.update(updateEventDto.clubId, id, req.user.id, updateEventDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除活动' })
  async delete(@Param('id') id: string, @Body() deleteDto: { clubId: string }, @Request() req) {
    return this.eventsService.delete(deleteDto.clubId, id, req.user.id);
  }

  @Post(':id/register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '报名活动' })
  async register(@Param('id') id: string, @Request() req) {
    return this.eventsService.register(id, req.user.id);
  }

  @Post(':id/cancel-registration')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '取消报名' })
  async cancelRegistration(@Param('id') id: string, @Request() req) {
    return this.eventsService.cancelRegistration(id, req.user.id);
  }

  @Post(':id/enable-checkin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '开启签到' })
  async enableCheckIn(@Param('id') id: string, @Request() req) {
    return this.eventsService.enableCheckIn(id, req.user.id);
  }

  @Post(':id/checkin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '签到' })
  async checkIn(@Param('id') id: string, @Request() req) {
    return this.eventsService.checkIn(id, req.user.id);
  }

  @Get(':id/checkin-stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取签到统计' })
  async getCheckInStats(@Param('id') id: string, @Request() req) {
    return this.eventsService.getCheckInStats(id, req.user.id);
  }

  @Post(':id/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '发布活动总结' })
  async createSummary(
    @Param('id') id: string,
    @Body() summaryDto: { content: string; photoUrls: string[] },
    @Request() req,
  ) {
    return this.eventsService.createSummary(id, req.user.id, summaryDto);
  }
}
