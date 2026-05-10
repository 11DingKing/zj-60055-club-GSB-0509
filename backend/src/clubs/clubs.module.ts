import { Module } from "@nestjs/common";
import { ClubsService } from "./clubs.service";
import { ClubsController } from "./clubs.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CategoriesController } from "./categories/categories.controller";
import { CategoriesService } from "./categories/categories.service";
import { ApplicationsController } from "./applications/applications.controller";
import { ApplicationsService } from "./applications/applications.service";
import { MembersController } from "./members/members.controller";
import { MembersService } from "./members/members.service";
import { AnnouncementsController } from "./announcements/announcements.controller";
import { AnnouncementsService } from "./announcements/announcements.service";
import { PointsModule } from "../points/points.module";

@Module({
  imports: [PrismaModule, PointsModule],
  controllers: [
    ClubsController,
    CategoriesController,
    ApplicationsController,
    MembersController,
    AnnouncementsController,
  ],
  providers: [
    ClubsService,
    CategoriesService,
    ApplicationsService,
    MembersService,
    AnnouncementsService,
  ],
  exports: [ClubsService],
})
export class ClubsModule {}
