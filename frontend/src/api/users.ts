import request from '@/utils/request';
import { User, EventRegistration, CheckInRecord, PointsInfo, PointsLogPage, Attendance } from '@/types';

export const usersApi = {
  getUsers: () => {
    return request.get<User[]>('/users');
  },

  getUserById: (id: string) => {
    return request.get<User>(`/users/${id}`);
  },

  updateUser: (id: string, data: Partial<User>) => {
    return request.put<User>(`/users/${id}`, data);
  },

  getCurrentUser: () => {
    return request.get<User>('/users/me');
  },

  getMyRegistrations: () => {
    return request.get<EventRegistration[]>('/users/me/registrations');
  },

  getMyCheckIns: () => {
    return request.get<CheckInRecord[]>('/users/me/checkins');
  },
};

export const attendanceApi = {
  checkInWithCode: (eventId: string, checkInCode: string) => {
    return request.post<Attendance>(`/attendance/events/${eventId}/checkin-code`, { checkInCode });
  },

  getEventAttendances: (eventId: string) => {
    return request.get<Attendance[]>(`/attendance/events/${eventId}`);
  },
};

export const pointsApi = {
  getMyPoints: () => {
    return request.get<PointsInfo>('/points/me');
  },

  getMyPointsLogs: (page?: number, pageSize?: number) => {
    return request.get<PointsLogPage>('/points/me/logs', {
      params: { page, pageSize },
    });
  },
};
