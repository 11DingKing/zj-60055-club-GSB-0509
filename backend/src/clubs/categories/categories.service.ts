import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.clubCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(name: string, description?: string) {
    const existing = await this.prisma.clubCategory.findUnique({
      where: { name },
    });

    if (existing) {
      throw new ConflictException('分类名称已存在');
    }

    return this.prisma.clubCategory.create({
      data: { name, description },
    });
  }

  async update(id: string, name: string, description?: string) {
    const category = await this.prisma.clubCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (name && name !== category.name) {
      const existing = await this.prisma.clubCategory.findUnique({
        where: { name },
      });
      if (existing) {
        throw new ConflictException('分类名称已存在');
      }
    }

    return this.prisma.clubCategory.update({
      where: { id },
      data: { name, description },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.clubCategory.findUnique({
      where: { id },
      include: { clubs: true },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.clubs.length > 0) {
      throw new ConflictException('该分类下存在社团，无法删除');
    }

    return this.prisma.clubCategory.delete({
      where: { id },
    });
  }
}
