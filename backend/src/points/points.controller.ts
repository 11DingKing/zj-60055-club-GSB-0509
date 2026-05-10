import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('积分')
@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的积分' })
  async getMyPoints(@Request() req) {
    return this.pointsService.getUserPoints(req.user.id);
  }

  @Get('me/logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的积分明细' })
  async getMyPointsLogs(
    @Request() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.pointsService.getUserPointsLogs(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
