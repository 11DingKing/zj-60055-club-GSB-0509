import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async award(userId: string, type: PointsType, amount: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [pointsLog] = await this.prisma.$transaction([
      this.prisma.pointsLog.create({
        data: {
          userId,
          type,
          amount,
          reason,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
      }),
    ]);

    return pointsLog;
  }

  async deduct(userId: string, type: PointsType, amount: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [pointsLog] = await this.prisma.$transaction([
      this.prisma.pointsLog.create({
        data: {
          userId,
          type,
          amount: -amount,
          reason,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      }),
    ]);

    return pointsLog;
  }

  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, points: true },
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
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
