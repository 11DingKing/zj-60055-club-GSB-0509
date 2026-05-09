import request from '@/utils/request';
import { LoginResponse, User } from '@/types';

export const authApi = {
  login: (data: { username: string; password: string }) => {
    return request.post<LoginResponse>('/auth/login', data);
  },

  register: (data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
  }) => {
    return request.post<User>('/auth/register', data);
  },

  getProfile: () => {
    return request.get<User>('/auth/profile');
  },
};
