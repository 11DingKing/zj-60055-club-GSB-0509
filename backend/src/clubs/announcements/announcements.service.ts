import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClubsService } from '../clubs.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private clubsService: ClubsService,
  ) {}

  async findByClub(clubId: string) {
    return this.prisma.clubAnnouncement.findMany({
      where: { clubId },
      orderBy: {
        isPinned: 'desc',
        publishedAt: 'desc',
      },
    });
  }

  async findOne(clubId: string, id: string) {
    const announcement = await this.prisma.clubAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement || announcement.clubId !== clubId) {
      throw new NotFoundException('公告不存在');
    }

    return announcement;
  }

  async create(clubId: string, userId: string, createAnnouncementDto: any) {
    const isLeader = await this.clubsService.isClubLeader(clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能发布公告');
    }

    return this.prisma.clubAnnouncement.create({
      data: {
        clubId,
        title: createAnnouncementDto.title,
        content: createAnnouncementDto.content,
        isPinned: createAnnouncementDto.isPinned || false,
      },
    });
  }

  async update(clubId: string, id: string, userId: string, updateAnnouncementDto: any) {
    const isLeader = await this.clubsService.isClubLeader(clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能修改公告');
    }

    const announcement = await this.prisma.clubAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement || announcement.clubId !== clubId) {
      throw new NotFoundException('公告不存在');
    }

    return this.prisma.clubAnnouncement.update({
      where: { id },
      data: {
        title: updateAnnouncementDto.title,
        content: updateAnnouncementDto.content,
        isPinned: updateAnnouncementDto.isPinned,
      },
    });
  }

  async remove(clubId: string, id: string, userId: string) {
    const isLeader = await this.clubsService.isClubLeader(clubId, userId);
    if (!isLeader) {
      throw new ForbiddenException('只有社团负责人才能删除公告');
    }

    const announcement = await this.prisma.clubAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement || announcement.clubId !== clubId) {
      throw new NotFoundException('公告不存在');
    }

    return this.prisma.clubAnnouncement.delete({
      where: { id },
    });
  }
}
