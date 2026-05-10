export enum UserRole {
  ADMIN = "ADMIN",
  CLUB_LEADER = "CLUB_LEADER",
  MEMBER = "MEMBER",
}

export enum EventType {
  LECTURE = "LECTURE",
  COMPETITION = "COMPETITION",
  GATHERING = "GATHERING",
  VOLUNTEER = "VOLUNTEER",
  TRAINING = "TRAINING",
}

export enum EventStatus {
  REGISTERING = "REGISTERING",
  REGISTRATION_CLOSED = "REGISTRATION_CLOSED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  points: number;
  createdAt: string;
}

export interface ClubCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  logoUrl?: string;
  recruitmentSlogan?: string;
  leaderId: string;
  isActive: boolean;
  createdAt: string;
  category?: ClubCategory;
  leader?: Pick<User, "id" | "name" | "avatar">;
  memberCount?: number;
  eventCount?: number;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  isViceLeader: boolean;
  joinedAt: string;
  user?: Pick<User, "id" | "name" | "avatar" | "username" | "email">;
}

export interface ClubAnnouncement {
  id: string;
  clubId: string;
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface Event {
  id: string;
  clubId: string;
  name: string;
  location: string;
  eventType: EventType;
  maxParticipants: number;
  registrationDeadline: string;
  description: string;
  coverImageUrl?: string;
  status: EventStatus;
  startTime: string;
  endTime: string;
  checkInEnabled: boolean;
  checkInCode?: string;
  createdAt: string;
  club?: Pick<Club, "id" | "name" | "logoUrl">;
  registrationCount?: number;
  isFull?: boolean;
  userRegistration?: EventRegistration;
  userCheckIn?: CheckInRecord;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  isCancelled: boolean;
  cancelledAt?: string;
  user?: Pick<User, "id" | "name" | "avatar">;
  event?: Event;
}

export interface CheckInRecord {
  id: string;
  eventId: string;
  userId: string;
  checkInTime: string;
  user?: Pick<User, "id" | "name" | "avatar">;
  event?: Event;
}

export interface EventSummary {
  id: string;
  eventId: string;
  content: string;
  photoUrls: string[];
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface DashboardStats {
  totalClubs: number;
  totalUsers: number;
  totalEvents: number;
  clubsByCategory: { id: string; name: string; value: number }[];
  thisMonthEvents: {
    id: string;
    name: string;
    startTime: string;
    status: EventStatus;
    registrationCount: number;
  }[];
  last30DaysParticipation: { date: string; count: number }[];
  topActiveClubs: {
    id: string;
    name: string;
    logoUrl?: string;
    eventCount: number;
    memberCount: number;
    totalParticipations: number;
    activityScore: number;
  }[];
  checkInStats: {
    id: string;
    name: string;
    totalRegistrations: number;
    checkedIn: number;
    checkInRate: number;
  }[];
}
