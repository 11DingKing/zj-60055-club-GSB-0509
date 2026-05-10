import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { ClubsService } from "../clubs/clubs.service";
import { EventStatus, EventType } from "@prisma/client";
import { PointsService } from "../points/points.service";

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private clubsService: ClubsService,
    private pointsService: PointsService,
  ) {}

  async findAll(clubId?: string, status?: EventStatus, userId?: string) {
    const where: any = {};

    if (clubId) {
      where.clubId = clubId;
    }

    if (status) {
      where.status = status;
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
        _count: {
          select: { registrations: { where: { isCancelled: false } } },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    const result = events.map((event) => ({
      ...event,
      registrationCount: event._count.registrations,
      _count: undefined,
    }));

    return result;
  }

  async findOne(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
        registrations: {
          where: { isCancelled: false },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        checkInRecords: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        summary: true,
        _count: {
          select: { registrations: { where: { isCancelled: false } } },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    let userRegistration = null;
    let userCheckIn = null;

    if (userId) {
      userRegistration =
        event.registrations.find((r) => r.userId === userId) || null;
      userCheckIn =
        event.checkInRecords.find((c) => c.userId === userId) || null;
    }

    const registrationCount = await this.getRegistrationCount(id);

    return {
      ...event,
      registrationCount,
      maxParticipants: event.maxParticipants,
      isFull: registrationCount >= event.maxParticipants,
      userRegistration,
      userCheckIn,
      _count: undefined,
    };
  }

  generateCheckInCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async create(clubId: string, userId: string, createEventDto: any) {
    const isLeader = await this.clubsService.isClubLeader(clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException("只有社团负责人才能创建活动");
    }

    const now = new Date();
    const registrationDeadline = new Date(createEventDto.registrationDeadline);
    const startTime = new Date(createEventDto.startTime);
    const endTime = new Date(createEventDto.endTime);

    if (registrationDeadline >= startTime) {
      throw new ConflictException("报名截止时间必须早于活动开始时间");
    }

    if (startTime >= endTime) {
      throw new ConflictException("活动开始时间必须早于结束时间");
    }

    let status: EventStatus = EventStatus.REGISTERING;
    if (now > registrationDeadline) {
      status = EventStatus.REGISTRATION_CLOSED;
    }
    if (now >= startTime && now <= endTime) {
      status = EventStatus.ONGOING;
    }
    if (now > endTime) {
      status = EventStatus.ENDED;
    }

    const event = await this.prisma.event.create({
      data: {
        clubId,
        name: createEventDto.name,
        location: createEventDto.location,
        eventType: createEventDto.eventType,
        maxParticipants: createEventDto.maxParticipants,
        registrationDeadline,
        description: createEventDto.description,
        coverImageUrl: createEventDto.coverImageUrl,
        startTime,
        endTime,
        status,
        checkInCode: this.generateCheckInCode(),
      },
      include: {
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    await this.pointsService.award(userId, 20, `创建活动：${event.name}`);

    return event;
  }

  async update(
    clubId: string,
    id: string,
    userId: string,
    updateEventDto: any,
  ) {
    const isLeader = await this.clubsService.isClubLeader(clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException("只有社团负责人才能修改活动");
    }

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException("活动不存在");
    }

    const updateData: any = {};

    if (updateEventDto.name !== undefined)
      updateData.name = updateEventDto.name;
    if (updateEventDto.location !== undefined)
      updateData.location = updateEventDto.location;
    if (updateEventDto.eventType !== undefined)
      updateData.eventType = updateEventDto.eventType;
    if (updateEventDto.maxParticipants !== undefined)
      updateData.maxParticipants = updateEventDto.maxParticipants;
    if (updateEventDto.description !== undefined)
      updateData.description = updateEventDto.description;
    if (updateEventDto.coverImageUrl !== undefined)
      updateData.coverImageUrl = updateEventDto.coverImageUrl;
    if (updateEventDto.registrationDeadline !== undefined)
      updateData.registrationDeadline = new Date(
        updateEventDto.registrationDeadline,
      );
    if (updateEventDto.startTime !== undefined)
      updateData.startTime = new Date(updateEventDto.startTime);
    if (updateEventDto.endTime !== undefined)
      updateData.endTime = new Date(updateEventDto.endTime);

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });
  }

  async delete(clubId: string, id: string, userId: string) {
    const isLeader = await this.clubsService.isClubLeader(clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException("只有社团负责人才能删除活动");
    }

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException("活动不存在");
    }

    await this.prisma.$transaction([
      this.prisma.eventSummary.deleteMany({ where: { eventId: id } }),
      this.prisma.checkInRecord.deleteMany({ where: { eventId: id } }),
      this.prisma.eventRegistration.deleteMany({ where: { eventId: id } }),
      this.prisma.event.delete({ where: { id } }),
    ]);

    await this.redisService.del(`event:registrations:${id}`);

    return { message: "活动已删除" };
  }

  async getRegistrationCount(eventId: string): Promise<number> {
    const cacheKey = `event:registrations:${eventId}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached !== null) {
      return parseInt(cached, 10);
    }

    const count = await this.prisma.eventRegistration.count({
      where: {
        eventId,
        isCancelled: false,
      },
    });

    await this.redisService.set(cacheKey, count.toString(), 300);
    return count;
  }

  async register(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    const now = new Date();
    if (now > event.registrationDeadline) {
      throw new ConflictException("报名已截止");
    }

    const isMember = await this.clubsService.isClubMember(event.clubId, userId);
    if (!isMember) {
      throw new ForbiddenException("只有社团成员才能报名活动");
    }

    return this.prisma.$transaction(async (prisma) => {
      const existingRegistration = await prisma.eventRegistration.findFirst({
        where: { eventId, userId },
      });

      if (existingRegistration) {
        if (!existingRegistration.isCancelled) {
          throw new ConflictException("您已报名该活动");
        }

        const result = await prisma.eventRegistration.update({
          where: { id: existingRegistration.id },
          data: { isCancelled: false, cancelledAt: null },
          include: {
            event: true,
          },
        });

        await this.redisService.hincrby(
          `event:registrations:${eventId}`,
          "count",
          1,
        );

        return result;
      }

      const currentRegistrations = await prisma.eventRegistration.count({
        where: { eventId, isCancelled: false },
      });

      if (currentRegistrations >= event.maxParticipants) {
        throw new ConflictException("活动报名人数已满");
      }

      const result = await prisma.eventRegistration.create({
        data: { eventId, userId },
        include: {
          event: true,
        },
      });

      await this.redisService.hincrby(
        `event:registrations:${eventId}`,
        "count",
        1,
      );

      return result;
    });
  }

  async cancelRegistration(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    const now = new Date();
    if (now > event.registrationDeadline) {
      throw new ConflictException("报名已截止，无法取消");
    }

    const registration = await this.prisma.eventRegistration.findFirst({
      where: { eventId, userId, isCancelled: false },
    });

    if (!registration) {
      throw new NotFoundException("您未报名该活动");
    }

    const hasAttended = await this.prisma.attendance.findFirst({
      where: { eventId, userId },
    });

    const result = await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { isCancelled: true, cancelledAt: now },
    });

    await this.redisService.hincrby(
      `event:registrations:${eventId}`,
      "count",
      -1,
    );

    if (hasAttended) {
      await this.pointsService.deduct(
        userId,
        5,
        `退出活动（已签到）：${event.name}`,
      );
    }

    return result;
  }

  async enableCheckIn(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    const isLeader = await this.clubsService.isClubLeader(event.clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException("只有社团负责人才能开启签到");
    }

    const now = new Date();
    if (now < event.startTime || now > event.endTime) {
      throw new ConflictException("只能在活动进行期间开启签到");
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { checkInEnabled: true },
    });
  }

  async checkIn(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    if (!event.checkInEnabled) {
      throw new ConflictException("活动签到尚未开启");
    }

    const registration = await this.prisma.eventRegistration.findFirst({
      where: { eventId, userId, isCancelled: false },
    });

    if (!registration) {
      throw new ForbiddenException("您未报名该活动，无法签到");
    }

    const existingCheckIn = await this.prisma.checkInRecord.findFirst({
      where: { eventId, userId },
    });

    if (existingCheckIn) {
      throw new ConflictException("您已签到");
    }

    return this.prisma.checkInRecord.create({
      data: { eventId, userId },
      include: {
        event: true,
      },
    });
  }

  async getCheckInStats(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    const isLeader = await this.clubsService.isClubLeader(event.clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException("只有社团负责人才能查看签到统计");
    }

    const [registrations, checkIns] = await Promise.all([
      this.prisma.eventRegistration.count({
        where: { eventId, isCancelled: false },
      }),
      this.prisma.checkInRecord.count({
        where: { eventId },
      }),
    ]);

    return {
      totalRegistrations: registrations,
      checkedIn: checkIns,
      checkInRate:
        registrations > 0 ? Math.round((checkIns / registrations) * 100) : 0,
    };
  }

  async createSummary(
    eventId: string,
    userId: string,
    summaryDto: { content: string; photoUrls: string[] },
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("活动不存在");
    }

    const isLeader = await this.clubsService.isClubLeader(event.clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException("只有社团负责人才能发布活动总结");
    }

    const now = new Date();
    if (now < event.endTime) {
      throw new ConflictException("活动未结束，无法发布总结");
    }

    const existingSummary = await this.prisma.eventSummary.findUnique({
      where: { eventId },
    });

    if (existingSummary) {
      return this.prisma.eventSummary.update({
        where: { eventId },
        data: {
          content: summaryDto.content,
          photoUrls: summaryDto.photoUrls,
        },
      });
    }

    return this.prisma.eventSummary.create({
      data: {
        eventId,
        content: summaryDto.content,
        photoUrls: summaryDto.photoUrls,
      },
    });
  }

  async updateEventStatuses() {
    const now = new Date();

    const events = await this.prisma.event.findMany({
      where: {
        status: { notIn: [EventStatus.ENDED] },
      },
    });

    for (const event of events) {
      let newStatus = event.status;

      if (now > event.endTime) {
        newStatus = EventStatus.ENDED;
      } else if (now >= event.startTime && now <= event.endTime) {
        newStatus = EventStatus.ONGOING;
      } else if (now > event.registrationDeadline) {
        newStatus = EventStatus.REGISTRATION_CLOSED;
      }

      if (newStatus !== event.status) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { status: newStatus },
        });
      }
    }
  }
}
