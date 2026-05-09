import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('统计')
@Controller('statistics')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取管理员看板统计数据' })
  async getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }
}
