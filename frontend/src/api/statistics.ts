import request from '@/utils/request';
import { DashboardStats } from '@/types';

export const statisticsApi = {
  getDashboardStats: () => {
    return request.get<DashboardStats>('/statistics/dashboard');
  },
};
