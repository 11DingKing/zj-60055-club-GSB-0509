import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('签到')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post(':eventId/checkin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '使用签到码签到' })
  async checkIn(
    @Param('eventId') eventId: string,
    @Body() body: { code: string },
    @Request() req,
  ) {
    return this.attendanceService.checkInWithCode(eventId, req.user.id, body.code);
  }

  @Post(':eventId/regenerate-code')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '重新生成签到码' })
  async regenerateCode(@Param('eventId') eventId: string, @Request() req) {
    return this.attendanceService.regenerateCheckInCode(eventId, req.user.id);
  }

  @Get(':eventId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取活动签到记录' })
  async getEventAttendance(@Param('eventId') eventId: string, @Request() req) {
    return this.attendanceService.getEventAttendance(eventId, req.user.id);
  }

  @Get('user/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的签到记录' })
  async getMyAttendance(@Request() req) {
    return this.attendanceService.getUserAttendance(req.user.id);
  }
}
