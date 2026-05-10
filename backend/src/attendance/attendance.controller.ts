import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInWithCodeDto } from './dto/check-in-with-code.dto';

@ApiTags('签到')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('events/:eventId/checkin-code')
  @ApiBearerAuth()
  @ApiOperation({ summary: '通过签到码签到' })
  async checkInWithCode(
    @Param('eventId') eventId: string,
    @Body() dto: CheckInWithCodeDto,
    @Request() req,
  ) {
    return this.attendanceService.checkInWithCode(eventId, req.user.id, dto);
  }

  @Get('events/:eventId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取活动签到记录' })
  async getEventAttendances(@Param('eventId') eventId: string) {
    return this.attendanceService.getEventAttendances(eventId);
  }
}
