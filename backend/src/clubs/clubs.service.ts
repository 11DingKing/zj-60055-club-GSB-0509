import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ClubsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(categoryId?: string, search?: string) {
    const cacheKey = `clubs:list:${categoryId || 'all'}:${search || ''}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const clubs = await this.prisma.club.findMany({
      where,
      include: {
        category: true,
        leader: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { members: true, events: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = clubs.map((club) => ({
      ...club,
      memberCount: club._count.members,
      eventCount: club._count.events,
      _count: undefined,
    }));

    await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        category: true,
        leader: {
          select: { id: true, name: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        announcements: {
          orderBy: {
            isPinned: 'desc',
            publishedAt: 'desc',
          },
          take: 10,
        },
        events: {
          orderBy: {
            startTime: 'desc',
          },
          take: 5,
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('社团不存在');
    }

    return {
      ...club,
      memberCount: club._count.members,
      _count: undefined,
    };
  }

  async update(id: string, updateClubDto: any, currentUser: any) {
    const club = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      throw new NotFoundException('社团不存在');
    }

    if (currentUser.role !== UserRole.ADMIN && club.leaderId !== currentUser.id) {
      const isMember = await this.prisma.clubMember.findFirst({
        where: {
          clubId: id,
          userId: currentUser.id,
          isViceLeader: true,
        },
      });

      if (!isMember) {
        throw new ForbiddenException('无权限修改此社团');
      }
    }

    const updatedClub = await this.prisma.club.update({
      where: { id },
      data: updateClubDto,
      include: {
        category: true,
        leader: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    await this.redisService.del('clubs:list:all:');
    return updatedClub;
  }

  async isClubLeader(clubId: string, userId: string): Promise<boolean> {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return false;
    }

    if (club.leaderId === userId) {
      return true;
    }

    const viceLeader = await this.prisma.clubMember.findFirst({
      where: {
        clubId,
        userId,
        isViceLeader: true,
      },
    });

    return !!viceLeader;
  }

  async isClubMember(clubId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.clubMember.findFirst({
      where: {
        clubId,
        userId,
      },
    });

    return !!member;
  }
}
