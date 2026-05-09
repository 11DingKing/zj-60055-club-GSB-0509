import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventStatus, ClubApplicationStatus } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getDashboardStats() {
    const cacheKey = 'stats:dashboard';
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [
      totalClubs,
      totalUsers,
      totalEvents,
      clubsByCategory,
      thisMonthEvents,
      last30DaysParticipation,
      topActiveClubs,
      checkInStats,
    ] = await Promise.all([
      this.prisma.club.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.getClubsByCategory(),
      this.getThisMonthEvents(),
      this.getLast30DaysParticipation(),
      this.getTopActiveClubs(),
      this.getCheckInStats(),
    ]);

    const result = {
      totalClubs,
      totalUsers,
      totalEvents,
      clubsByCategory,
      thisMonthEvents,
      last30DaysParticipation,
      topActiveClubs,
      checkInStats,
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), 60);
    return result;
  }

  private async getClubsByCategory() {
    const categories = await this.prisma.clubCategory.findMany({
      include: {
        _count: {
          select: { clubs: { where: { isActive: true } } },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      value: cat._count.clubs,
    }));
  }

  private async getThisMonthEvents() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const events = await this.prisma.event.findMany({
      where: {
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        status: true,
        _count: {
          select: { registrations: { where: { isCancelled: false } } },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      startTime: event.startTime,
      status: event.status,
      registrationCount: event._count.registrations,
    }));
  }

  private async getLast30DaysParticipation() {
    const now = new Date();
    const days = [];
    const result = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push(dateStr);
    }

    for (const day of days) {
      const startOfDay = new Date(day);
      const endOfDay = new Date(day);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const count = await this.prisma.eventRegistration.count({
        where: {
          registeredAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          isCancelled: false,
        },
      });

      result.push({
        date: day,
        count,
      });
    }

    return result;
  }

  private async getTopActiveClubs() {
    const clubs = await this.prisma.club.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
        events: {
          include: {
            _count: {
              select: { registrations: { where: { isCancelled: false } } },
            },
          },
        },
      },
    });

    const clubScores = clubs.map((club) => {
      const totalParticipations = club.events.reduce(
        (sum, event) => sum + event._count.registrations,
        0,
      );
      const activityScore = club._count.events * 10 + totalParticipations * 2;

      return {
        id: club.id,
        name: club.name,
        logoUrl: club.logoUrl,
        eventCount: club._count.events,
        memberCount: club._count.members,
        totalParticipations,
        activityScore,
      };
    });

    clubScores.sort((a, b) => b.activityScore - a.activityScore);

    return clubScores.slice(0, 5);
  }

  private async getCheckInStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const events = await this.prisma.event.findMany({
      where: {
        status: EventStatus.ENDED,
        endTime: {
          gte: startOfMonth,
        },
      },
      include: {
        _count: {
          select: {
            registrations: { where: { isCancelled: false } },
            checkInRecords: true,
          },
        },
      },
    });

    const stats = events.map((event) => ({
      id: event.id,
      name: event.name,
      totalRegistrations: event._count.registrations,
      checkedIn: event._count.checkInRecords,
      checkInRate:
        event._count.registrations > 0
          ? Math.round((event._count.checkInRecords / event._count.registrations) * 100)
          : 0,
    }));

    return stats;
  }
}
