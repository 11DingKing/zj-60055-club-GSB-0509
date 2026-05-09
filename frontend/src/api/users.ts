import request from '@/utils/request';
import { User, EventRegistration, CheckInRecord } from '@/types';

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
