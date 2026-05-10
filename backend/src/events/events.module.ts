import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClubsModule } from '../clubs/clubs.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ClubsModule), forwardRef(() => PointsModule)],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
