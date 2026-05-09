import { Controller, Get, Post, Delete, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('社团成员')
@Controller('clubs/:clubId/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取社团成员列表' })
  async findByClub(@Param('clubId') clubId: string) {
    return this.membersService.findByClub(clubId);
  }

  @Post('invite')
  @ApiBearerAuth()
  @ApiOperation({ summary: '邀请成员加入社团' })
  async invite(
    @Param('clubId') clubId: string,
    @Body() inviteDto: { userId: string },
    @Request() req,
  ) {
    return this.membersService.invite(clubId, inviteDto.userId, req.user.id);
  }

  @Post('join')
  @ApiBearerAuth()
  @ApiOperation({ summary: '申请加入社团' })
  async joinClub(@Param('clubId') clubId: string, @Request() req) {
    return this.membersService.joinClub(clubId, req.user.id);
  }

  @Delete(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '移除社团成员' })
  async remove(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.membersService.remove(clubId, userId, req.user.id);
  }

  @Put(':userId/vice-leader')
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置/取消副负责人' })
  async setViceLeader(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() setViceLeaderDto: { isViceLeader: boolean },
    @Request() req,
  ) {
    return this.membersService.setViceLeader(
      clubId,
      userId,
      req.user.id,
      setViceLeaderDto.isViceLeader,
    );
  }
}
