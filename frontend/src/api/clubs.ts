import request from '@/utils/request';
import {
  Club,
  ClubCategory,
  ClubAnnouncement,
  ClubMember,
} from '@/types';

export const clubsApi = {
  getClubs: (params?: { categoryId?: string; search?: string }) => {
    return request.get<Club[]>('/clubs', { params });
  },

  getClubById: (id: string) => {
    return request.get<Club>(`/clubs/${id}`);
  },

  updateClub: (id: string, data: Partial<Club>) => {
    return request.put<Club>(`/clubs/${id}`, data);
  },

  getCategories: () => {
    return request.get<ClubCategory[]>('/club-categories');
  },

  createCategory: (data: { name: string; description?: string }) => {
    return request.post<ClubCategory>('/club-categories', data);
  },

  updateCategory: (id: string, data: { name: string; description?: string }) => {
    return request.put<ClubCategory>(`/club-categories/${id}`, data);
  },

  deleteCategory: (id: string) => {
    return request.delete(`/club-categories/${id}`);
  },

  getMyApplications: () => {
    return request.get('/club-applications/my');
  },

  createApplication: (data: {
    name: string;
    categoryId: string;
    description: string;
    logoUrl?: string;
    recruitmentSlogan?: string;
  }) => {
    return request.post('/club-applications', data);
  },

  getAllApplications: (params?: { status?: string }) => {
    return request.get('/club-applications', { params });
  },

  approveApplication: (id: string) => {
    return request.put(`/club-applications/${id}/approve`);
  },

  rejectApplication: (id: string, data: { rejectReason: string }) => {
    return request.put(`/club-applications/${id}/reject`, data);
  },

  getMembers: (clubId: string) => {
    return request.get<ClubMember[]>(`/clubs/${clubId}/members`);
  },

  inviteMember: (clubId: string, data: { userId: string }) => {
    return request.post(`/clubs/${clubId}/members/invite`, data);
  },

  joinClub: (clubId: string) => {
    return request.post(`/clubs/${clubId}/members/join`);
  },

  removeMember: (clubId: string, userId: string) => {
    return request.delete(`/clubs/${clubId}/members/${userId}`);
  },

  setViceLeader: (clubId: string, userId: string, data: { isViceLeader: boolean }) => {
    return request.put(`/clubs/${clubId}/members/${userId}/vice-leader`, data);
  },

  getAnnouncements: (clubId: string) => {
    return request.get<ClubAnnouncement[]>(`/clubs/${clubId}/announcements`);
  },

  getAnnouncement: (clubId: string, id: string) => {
    return request.get<ClubAnnouncement>(`/clubs/${clubId}/announcements/${id}`);
  },

  createAnnouncement: (clubId: string, data: { title: string; content: string; isPinned?: boolean }) => {
    return request.post(`/clubs/${clubId}/announcements`, data);
  },

  updateAnnouncement: (clubId: string, id: string, data: Partial<ClubAnnouncement>) => {
    return request.put(`/clubs/${clubId}/announcements/${id}`, data);
  },

  deleteAnnouncement: (clubId: string, id: string) => {
    return request.delete(`/clubs/${clubId}/announcements/${id}`);
  },
};
