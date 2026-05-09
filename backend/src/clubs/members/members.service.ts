import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClubsService } from '../clubs.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private clubsService: ClubsService,
  ) {}

  async findByClub(clubId: string) {
    return this.prisma.clubMember.findMany({
      where: { clubId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, email: true },
        },
      },
      orderBy: {
        isViceLeader: 'desc',
        joinedAt: 'asc',
      },
    });
  }

  async invite(clubId: string, userId: string, inviterId: string) {
    const isLeader = await this.clubsService.isClubLeader(clubId, inviterId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能邀请成员');
    }

    const existingMember = await this.prisma.clubMember.findFirst({
      where: { clubId, userId },
    });

    if (existingMember) {
      throw new ConflictException('该用户已是社团成员');
    }

    return this.prisma.clubMember.create({
      data: { clubId, userId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });
  }

  async remove(clubId: string, userId: string, operatorId: string) {
    const isLeader = await this.clubsService.isClubLeader(clubId, operatorId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能移除成员');
    }

    const member = await this.prisma.clubMember.findFirst({
      where: { clubId, userId },
    });

    if (!member) {
      throw new NotFoundException('该用户不是社团成员');
    }

    if (member.isViceLeader) {
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
      });
      if (club?.leaderId === userId) {
        throw new ForbiddenException('不能移除社团负责人');
      }
    }

    return this.prisma.clubMember.delete({
      where: { id: member.id },
    });
  }

  async setViceLeader(clubId: string, userId: string, operatorId: string, isViceLeader: boolean) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('社团不存在');
    }

    if (club.leaderId !== operatorId) {
      throw new ForbiddenException('只有社团负责人才能设置副负责人');
    }

    if (club.leaderId === userId) {
      throw new ForbiddenException('不能修改社团负责人的角色');
    }

    const member = await this.prisma.clubMember.findFirst({
      where: { clubId, userId },
    });

    if (!member) {
      throw new NotFoundException('该用户不是社团成员');
    }

    return this.prisma.clubMember.update({
      where: { id: member.id },
      data: { isViceLeader },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });
  }

  async joinClub(clubId: string, userId: string) {
    const existingMember = await this.prisma.clubMember.findFirst({
      where: { clubId, userId },
    });

    if (existingMember) {
      throw new ConflictException('您已是社团成员');
    }

    return this.prisma.clubMember.create({
      data: { clubId, userId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });
  }
}
