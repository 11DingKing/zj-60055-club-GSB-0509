import { PrismaClient, UserRole, EventType, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      email: 'admin@club.com',
      phone: '13800000001',
      role: UserRole.ADMIN,
    },
  });

  console.log('管理员用户创建/更新完成:', admin.username);

  const categories = await Promise.all([
    prisma.clubCategory.upsert({
      where: { name: '学术类' },
      update: {},
      create: { name: '学术类', description: '学术研究、知识分享类社团' },
    }),
    prisma.clubCategory.upsert({
      where: { name: '体育类' },
      update: {},
      create: { name: '体育类', description: '体育运动、健身锻炼类社团' },
    }),
    prisma.clubCategory.upsert({
      where: { name: '文艺类' },
      update: {},
      create: { name: '文艺类', description: '文化艺术、表演展示类社团' },
    }),
    prisma.clubCategory.upsert({
      where: { name: '公益类' },
      update: {},
      create: { name: '公益类', description: '志愿服务、公益活动类社团' },
    }),
    prisma.clubCategory.upsert({
      where: { name: '科技类' },
      update: {},
      create: { name: '科技类', description: '科技创新、编程开发类社团' },
    }),
  ]);

  console.log('社团分类创建完成:', categories.map((c) => c.name).join(', '));

  const users = [];
  const userNames = [
    { username: 'leader1', name: '张明', role: UserRole.CLUB_LEADER },
    { username: 'leader2', name: '李华', role: UserRole.CLUB_LEADER },
    { username: 'leader3', name: '王芳', role: UserRole.CLUB_LEADER },
    { username: 'leader4', name: '刘强', role: UserRole.CLUB_LEADER },
    { username: 'user1', name: '陈小红', role: UserRole.MEMBER },
    { username: 'user2', name: '赵大伟', role: UserRole.MEMBER },
    { username: 'user3', name: '孙丽', role: UserRole.MEMBER },
    { username: 'user4', name: '周杰', role: UserRole.MEMBER },
    { username: 'user5', name: '吴敏', role: UserRole.MEMBER },
    { username: 'user6', name: '郑浩', role: UserRole.MEMBER },
    { username: 'user7', name: '黄丽娟', role: UserRole.MEMBER },
    { username: 'user8', name: '林涛', role: UserRole.MEMBER },
    { username: 'user9', name: '冯雪', role: UserRole.MEMBER },
    { username: 'user10', name: '董明', role: UserRole.MEMBER },
    { username: 'user11', name: '段文', role: UserRole.MEMBER },
    { username: 'user12', name: '崔莹莹', role: UserRole.MEMBER },
  ];

  for (let i = 0; i < userNames.length; i++) {
    const userData = userNames[i];
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        username: userData.username,
        password: hashedPassword,
        name: userData.name,
        email: `${userData.username}@club.com`,
        phone: `138000000${(i + 2).toString().padStart(2, '0')}`,
        role: userData.role,
      },
    });
    users.push(user);
  }

  console.log('用户创建完成，共', users.length, '个用户');

  const leaders = users.filter((u) => u.role === UserRole.CLUB_LEADER);
  const members = users.filter((u) => u.role === UserRole.MEMBER);

  const now = new Date();

  const clubsData = [
    {
      name: '科技创新社',
      category: categories[4],
      leader: leaders[0],
      description: '致力于科技创新和编程开发，定期举办技术分享会和编程竞赛。',
      logoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20innovation%20club%20logo%20modern%20style&image_size=square',
      recruitmentSlogan: '加入我们，探索科技的无限可能！',
      memberIndices: [0, 1, 2, 3, 4, 5],
    },
    {
      name: '篮球爱好者协会',
      category: categories[1],
      leader: leaders[1],
      description: '篮球运动爱好者的聚集地，每周组织训练和友谊赛。',
      logoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20club%20logo%20sport%20style&image_size=square',
      recruitmentSlogan: '无兄弟，不篮球！',
      memberIndices: [2, 3, 4, 5, 6, 7],
    },
    {
      name: '音乐表演社',
      category: categories[2],
      leader: leaders[2],
      description: '音乐爱好者交流平台，包含声乐、器乐等多种表演形式。',
      logoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20club%20logo%20artistic%20style&image_size=square',
      recruitmentSlogan: '用音乐点亮生活！',
      memberIndices: [4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: '志愿者协会',
      category: categories[3],
      leader: leaders[3],
      description: '组织各类志愿服务活动，传递爱心，回报社会。',
      logoUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20club%20logo%20warm%20heart%20style&image_size=square',
      recruitmentSlogan: '志愿有你，温暖同行！',
      memberIndices: [6, 7, 8, 9, 10, 11],
    },
  ];

  const clubs = [];
  for (const clubData of clubsData) {
    const club = await prisma.club.upsert({
      where: { name: clubData.name },
      update: {},
      create: {
        name: clubData.name,
        categoryId: clubData.category.id,
        description: clubData.description,
        logoUrl: clubData.logoUrl,
        recruitmentSlogan: clubData.recruitmentSlogan,
        leaderId: clubData.leader.id,
      },
    });
    clubs.push(club);

    await prisma.clubMember.upsert({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: clubData.leader.id,
        },
      },
      update: {},
      create: {
        clubId: club.id,
        userId: clubData.leader.id,
      },
    });

    for (const idx of clubData.memberIndices) {
      const member = members[idx];
      if (member) {
        await prisma.clubMember.upsert({
          where: {
            clubId_userId: {
              clubId: club.id,
              userId: member.id,
            },
          },
          update: {},
          create: {
            clubId: club.id,
            userId: member.id,
          },
        });
      }
    }
  }

  console.log('社团创建完成，共', clubs.length, '个社团');

  for (const club of clubs) {
    const clubMembers = await prisma.clubMember.findMany({
      where: { clubId: club.id },
      select: { userId: true },
    });
    const memberUserIds = clubMembers.map((m) => m.userId);

    const announcements = [
      {
        title: '欢迎新成员加入',
        content: `欢迎各位新成员加入${club.name}！请关注后续活动通知。`,
        isPinned: true,
      },
      {
        title: '近期活动安排',
        content: '本周五下午3点将召开社团例会，请各位成员准时参加。',
        isPinned: false,
      },
    ];

    for (const ann of announcements) {
      await prisma.clubAnnouncement.upsert({
        where: {
          id: `${club.id}-${ann.title}`,
        },
        update: {},
        create: {
          id: `${club.id}-${ann.title}`,
          clubId: club.id,
          title: ann.title,
          content: ann.content,
          isPinned: ann.isPinned,
        },
      });
    }

    const eventTypes = [EventType.LECTURE, EventType.GATHERING, EventType.TRAINING];
    const eventNames = {
      [EventType.LECTURE]: '技术讲座',
      [EventType.GATHERING]: '社团聚会',
      [EventType.TRAINING]: '技能培训',
    };

    for (let i = 0; i < 3; i++) {
      const eventType = eventTypes[i];
      const daysAgo = (2 - i) * 10;
      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() - daysAgo);

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      const registrationDeadline = new Date(startTime);
      registrationDeadline.setDate(registrationDeadline.getDate() - 1);

      let status: EventStatus = EventStatus.ENDED;
      if (i === 0) {
        status = EventStatus.REGISTERING;
        startTime.setDate(startTime.getDate() + 30);
        endTime.setDate(endTime.getDate() + 30);
        registrationDeadline.setDate(registrationDeadline.getDate() + 30);
      }

      const event = await prisma.event.upsert({
        where: {
          id: `${club.id}-event-${i}`,
        },
        update: {},
        create: {
          id: `${club.id}-event-${i}`,
          clubId: club.id,
          name: `${club.name}${eventNames[eventType]}第${i + 1}期`,
          location: `活动中心${i + 1}号会议室`,
          eventType: eventType,
          maxParticipants: 20,
          registrationDeadline,
          description: `这是${club.name}的精彩活动，欢迎各位成员积极参与！`,
          coverImageUrl: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=event%20activity%20poster%20modern%20design%20colorful&image_size=landscape_16_9`,
          status,
          startTime,
          endTime,
        },
      });

      const registrations = [];
      const checkIns = [];

      for (let j = 0; j < Math.min(memberUserIds.length, 6); j++) {
        const userId = memberUserIds[j];
        registrations.push({
          eventId: event.id,
          userId,
          registeredAt: new Date(startTime.getTime() - 86400000 * 2),
          isCancelled: false,
        });

        if (status === EventStatus.ENDED && j < 4) {
          checkIns.push({
            eventId: event.id,
            userId,
            checkInTime: new Date(startTime.getTime() + 600000),
          });
        }
      }

      for (const reg of registrations) {
        await prisma.eventRegistration.upsert({
          where: {
            eventId_userId: {
              eventId: reg.eventId,
              userId: reg.userId,
            },
          },
          update: {},
          create: reg,
        });
      }

      for (const checkIn of checkIns) {
        await prisma.checkInRecord.upsert({
          where: {
            eventId_userId: {
              eventId: checkIn.eventId,
              userId: checkIn.userId,
            },
          },
          update: {},
          create: checkIn,
        });
      }

      if (status === EventStatus.ENDED) {
        await prisma.eventSummary.upsert({
          where: { eventId: event.id },
          update: {},
          create: {
            eventId: event.id,
            content: `本次活动圆满结束！感谢各位成员的积极参与。活动中大家交流热烈，收获颇丰。期待下次再见！`,
            photoUrls: [
              `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=event%20group%20photo%20happy%20people%20celebration&image_size=square`,
              `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=event%20activity%20scene%20people%20working&image_size=square`,
            ],
          },
        });
      }
    }
  }

  console.log('活动及相关数据创建完成');
  console.log('播种数据完成！');
  console.log('');
  console.log('默认账号信息：');
  console.log('  管理员: admin / 123456');
  console.log('  社团负责人: leader1 ~ leader4 / 123456');
  console.log('  普通成员: user1 ~ user12 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
