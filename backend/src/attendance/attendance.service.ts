import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ClubsService } from '../clubs/clubs.service';
import { PointsService } from '../points/points.service';
import { CheckInWithCodeDto } from './dto/check-in-with-code.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private clubsService: ClubsService,
    private pointsService: PointsService,
  ) {}

  async checkInWithCode(eventId: string, userId: string, dto: CheckInWithCodeDto) {
    const rateKey = `attendance:rate:${userId}:${eventId}`;
    const rateCount = await this.redisService.get(rateKey);
    if (rateCount && parseInt(rateCount, 10) >= 1) {
      throw new BadRequestException('操作过于频繁，请3秒后再试');
    }
    await this.redisService.set(rateKey, '1', 3);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('活动不存在');
    }

    if (!event.checkInCode) {
      throw new ConflictException('该活动未设置签到码');
    }

    if (event.checkInCode !== dto.checkInCode) {
      throw new BadRequestException('签到码错误');
    }

    const now = new Date();
    const checkInWindowStart = new Date(event.startTime.getTime() - 30 * 60 * 1000);
    const checkInWindowEnd = new Date(event.endTime.getTime() + 30 * 60 * 1000);

    if (now < checkInWindowStart || now > checkInWindowEnd) {
      throw new ConflictException('不在签到时间窗口内（活动开始前30分钟至结束后30分钟）');
    }

    const isMember = await this.clubsService.isClubMember(event.clubId, userId);
    if (!isMember) {
      throw new ForbiddenException('只有社团成员才能签到');
    }

    const registration = await this.prisma.eventRegistration.findFirst({
      where: { eventId, userId, isCancelled: false },
    });

    if (!registration) {
      throw new ForbiddenException('您未报名该活动，无法签到');
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: { eventId, userId },
    });

    if (existingAttendance) {
      throw new ConflictException('您已签到');
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        eventId,
        userId,
        checkInCode: dto.checkInCode,
      },
      include: {
        event: {
          select: { id: true, name: true },
        },
      },
    });

    await this.pointsService.award(userId, 'CHECK_IN', 10, `参加活动签到: ${event.name}`);

    return attendance;
  }

  async getEventAttendances(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('活动不存在');
    }

    return this.prisma.attendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { checkedInAt: 'asc' },
    });
  }
}
