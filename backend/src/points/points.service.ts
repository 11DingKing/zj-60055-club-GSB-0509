import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsLogType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async award(userId: string, amount: number, reason: string) {
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: amount,
          },
        },
      });

      await prisma.pointsLog.create({
        data: {
          userId,
          type: PointsLogType.AWARD,
          amount,
          reason,
        },
      });

      return user;
    });
  }

  async deduct(userId: string, amount: number, reason: string) {
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            decrement: amount,
          },
        },
      });

      await prisma.pointsLog.create({
        data: {
          userId,
          type: PointsLogType.DEDUCT,
          amount,
          reason,
        },
      });

      return user;
    });
  }

  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        points: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async getUserPointsLogs(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.pointsLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.pointsLog.count({
        where: { userId },
      }),
    ]);

    return {
      list: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
