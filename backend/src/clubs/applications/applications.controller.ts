import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, ClubApplicationStatus } from '@prisma/client';

@ApiTags('社团申请')
@Controller('club-applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取所有社团申请列表（管理员）' })
  async findAll(@Query('status') status?: ClubApplicationStatus) {
    return this.applicationsService.findAll(status);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的社团申请' })
  async findMyApplications(@Request() req) {
    return this.applicationsService.findMyApplications(req.user.id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '申请创建社团' })
  async create(@Body() createApplicationDto: any, @Request() req) {
    return this.applicationsService.create(req.user.id, createApplicationDto);
  }

  @Put(':id/approve')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '审核通过社团申请（管理员）' })
  async approve(@Param('id') id: string, @Request() req) {
    return this.applicationsService.review(id, req.user.id, 'approve');
  }

  @Put(':id/reject')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '审核拒绝社团申请（管理员）' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: { rejectReason: string },
    @Request() req,
  ) {
    return this.applicationsService.review(id, req.user.id, 'reject', rejectDto.rejectReason);
  }
}
