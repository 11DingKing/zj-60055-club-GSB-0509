import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClubApplicationStatus, UserRole } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: ClubApplicationStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.clubApplication.findMany({
      where,
      include: {
        applicant: {
          select: { id: true, name: true, username: true },
        },
        category: true,
        reviewer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyApplications(userId: string) {
    return this.prisma.clubApplication.findMany({
      where: { applicantId: userId },
      include: {
        category: true,
        reviewer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, createApplicationDto: any) {
    const existingApplication = await this.prisma.clubApplication.findFirst({
      where: {
        applicantId: userId,
        status: ClubApplicationStatus.PENDING,
      },
    });

    if (existingApplication) {
      throw new ConflictException('您已有一个待审核的社团创建申请');
    }

    const existingClub = await this.prisma.club.findUnique({
      where: { name: createApplicationDto.name },
    });

    if (existingClub) {
      throw new ConflictException('社团名称已存在');
    }

    return this.prisma.clubApplication.create({
      data: {
        applicantId: userId,
        name: createApplicationDto.name,
        categoryId: createApplicationDto.categoryId,
        description: createApplicationDto.description,
        logoUrl: createApplicationDto.logoUrl,
        recruitmentSlogan: createApplicationDto.recruitmentSlogan,
      },
      include: {
        category: true,
      },
    });
  }

  async review(
    applicationId: string,
    adminId: string,
    action: 'approve' | 'reject',
    rejectReason?: string,
  ) {
    const application = await this.prisma.clubApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    if (application.status !== ClubApplicationStatus.PENDING) {
      throw new ConflictException('该申请已被处理');
    }

    if (action === 'approve') {
      return this.prisma.$transaction(async (prisma) => {
        const updatedApplication = await prisma.clubApplication.update({
          where: { id: applicationId },
          data: {
            status: ClubApplicationStatus.APPROVED,
            reviewedAt: new Date(),
            reviewedById: adminId,
          },
        });

        const club = await prisma.club.create({
          data: {
            name: application.name,
            categoryId: application.categoryId,
            description: application.description,
            logoUrl: application.logoUrl,
            recruitmentSlogan: application.recruitmentSlogan,
            leaderId: application.applicantId,
          },
          include: {
            category: true,
          },
        });

        await prisma.clubMember.create({
          data: {
            clubId: club.id,
            userId: application.applicantId,
          },
        });

        await prisma.user.update({
          where: { id: application.applicantId },
          data: { role: UserRole.CLUB_LEADER },
        });

        return { application: updatedApplication, club };
      });
    } else {
      return this.prisma.clubApplication.update({
        where: { id: applicationId },
        data: {
          status: ClubApplicationStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: adminId,
          rejectReason: rejectReason,
        },
      });
    }
  }
}
