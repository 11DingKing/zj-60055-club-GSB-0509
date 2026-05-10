import request from "@/utils/request";
import { Event, EventStatus } from "@/types";

export const eventsApi = {
  getEvents: (params?: { clubId?: string; status?: EventStatus }) => {
    return request.get<Event[]>("/events", { params });
  },

  getEventById: (id: string) => {
    return request.get<Event>(`/events/${id}`);
  },

  createEvent: (data: {
    clubId: string;
    name: string;
    location: string;
    eventType: string;
    maxParticipants: number;
    registrationDeadline: string;
    description: string;
    coverImageUrl?: string;
    startTime: string;
    endTime: string;
  }) => {
    return request.post<Event>("/events", data);
  },

  updateEvent: (id: string, data: any) => {
    return request.put<Event>(`/events/${id}`, data);
  },

  deleteEvent: (id: string, data: { clubId: string }) => {
    return request.delete(`/events/${id}`, { data });
  },

  register: (id: string) => {
    return request.post(`/events/${id}/register`);
  },

  cancelRegistration: (id: string) => {
    return request.post(`/events/${id}/cancel-registration`);
  },

  enableCheckIn: (id: string) => {
    return request.post(`/events/${id}/enable-checkin`);
  },

  checkIn: (id: string) => {
    return request.post(`/events/${id}/checkin`);
  },

  getCheckInStats: (id: string) => {
    return request.get(`/events/${id}/checkin-stats`);
  },

  generateCheckInCode: (id: string) => {
    return request.post<{ id: string; checkInCode: string }>(
      `/events/${id}/generate-checkin-code`,
    );
  },

  regenerateCheckInCode: (id: string) => {
    return request.post<{ id: string; checkInCode: string }>(
      `/events/${id}/regenerate-checkin-code`,
    );
  },

  createSummary: (
    id: string,
    data: { content: string; photoUrls: string[] },
  ) => {
    return request.post(`/events/${id}/summary`, data);
  },
};
