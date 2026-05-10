import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('积分')
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的积分' })
  async getMyPoints(@Request() req) {
    return this.pointsService.getUserPoints(req.user.id);
  }

  @Get('me/logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的积分明细' })
  async getMyPointsLogs(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.pointsService.getUserPointsLogs(
      req.user.id,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }
}
