import { Controller, Get, Param, Put, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('用户')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取所有用户列表（管理员）' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('me/registrations')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的活动报名记录' })
  async getMyRegistrations(@Request() req) {
    return this.usersService.getMyRegistrations(req.user.id);
  }

  @Get('me/checkins')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的签到记录' })
  async getMyCheckIns(@Request() req) {
    return this.usersService.getMyCheckIns(req.user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户详情' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }
}
