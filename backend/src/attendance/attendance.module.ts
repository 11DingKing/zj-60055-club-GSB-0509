import { Module, forwardRef } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ClubsModule } from '../clubs/clubs.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PrismaModule, RedisModule, forwardRef(() => ClubsModule), forwardRef(() => PointsModule)],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
