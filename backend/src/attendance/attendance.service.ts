import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ClubsService } from '../clubs/clubs.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private clubsService: ClubsService,
    private pointsService: PointsService,
  ) {}

  generateCheckInCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async regenerateCheckInCode(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('活动不存在');
    }

    const isLeader = await this.clubsService.isClubLeader(event.clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能重新生成签到码');
    }

    const newCode = this.generateCheckInCode();
    return this.prisma.event.update({
      where: { id: eventId },
      data: { checkInCode: newCode },
    });
  }

  async checkInWithCode(eventId: string, userId: string, code: string) {
    const rateLimitKey = `attendance:rate_limit:${eventId}:${userId}`;
    const lastRequest = await this.redisService.get(rateLimitKey);

    if (lastRequest) {
      throw new BadRequestException('提交过于频繁，请3秒后再试');
    }

    await this.redisService.set(rateLimitKey, '1', 3);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('活动不存在');
    }

    if (!event.checkInCode || event.checkInCode !== code) {
      throw new BadRequestException('签到码错误');
    }

    const now = new Date();
    const checkInStart = new Date(event.startTime.getTime() - 30 * 60 * 1000);
    const checkInEnd = new Date(event.endTime.getTime() + 30 * 60 * 1000);

    if (now < checkInStart) {
      throw new ConflictException('签到尚未开始，请在活动开始前30分钟内签到');
    }

    if (now > checkInEnd) {
      throw new ConflictException('签到已结束，请在活动结束后30分钟内签到');
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
      data: { eventId, userId },
      include: {
        event: true,
      },
    });

    await this.pointsService.award(userId, 10, `参加活动：${event.name}`);

    return attendance;
  }

  async getEventAttendance(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('活动不存在');
    }

    const isLeader = await this.clubsService.isClubLeader(event.clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能查看签到记录');
    }

    return this.prisma.attendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: {
        checkedInAt: 'asc',
      },
    });
  }

  async getUserAttendance(userId: string) {
    return this.prisma.attendance.findMany({
      where: { userId },
      include: {
        event: {
          select: { id: true, name: true, startTime: true, location: true },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });
  }
}
