import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        memberships: {
          include: {
            club: true,
          },
        },
        ledClubs: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: string, updateUserDto: Partial<User>, currentUser: any) {
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权限修改此用户');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getMyRegistrations(userId: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: {
        userId,
        isCancelled: false,
      },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    return registrations;
  }

  async getMyCheckIns(userId: string) {
    const checkIns = await this.prisma.checkInRecord.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    return checkIns;
  }
}
