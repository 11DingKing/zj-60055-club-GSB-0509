import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClubsModule } from '../clubs/clubs.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PrismaModule, ClubsModule, PointsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
