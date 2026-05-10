import request from '@/utils/request';

export interface PointsLog {
  id: string;
  userId: string;
  type: 'AWARD' | 'DEDUCT';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface PointsInfo {
  id: string;
  points: number;
}

export interface PointsLogsResponse {
  list: PointsLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const pointsApi = {
  getMyPoints: () => {
    return request.get<PointsInfo>('/points/me');
  },

  getMyPointsLogs: (params?: { page?: number; pageSize?: number }) => {
    return request.get<PointsLogsResponse>('/points/me/logs', { params });
  },
};
