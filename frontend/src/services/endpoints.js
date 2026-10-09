// Une fonction par endpoint du contrat (voir backend/docs/API.md).
import { request } from './api.js';

const ev = (eventId) => `/events/${eventId}`;

export const api = {
  auth: {
    devUsers: () => request('/auth/dev-users'),
    devLogin: (payload) => request('/auth/dev-login', { method: 'POST', body: payload }),
  },
  profile: () => request('/profile'),
  notifications: {
    list: (params) => request('/notifications', { params }),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
  },
  events: {
    list: () => request('/events'),
    get: (eventId) => request(ev(eventId)),
    search: (eventId, q) => request(`${ev(eventId)}/search`, { params: { q } }),
    dashboard: (eventId) => request(`${ev(eventId)}/dashboard`),
    autoAssign: (eventId) => request(`${ev(eventId)}/assignments/auto`, { method: 'POST' }),
  },
  candidates: {
    list: (eventId, params) => request(`${ev(eventId)}/candidates`, { params }),
    get: (eventId, id) => request(`${ev(eventId)}/candidates/${id}`),
    setStatus: (eventId, id, status) => request(`${ev(eventId)}/candidates/${id}/status`, { method: 'PATCH', body: { status } }),
    assign: (eventId, id, selectorId) => request(`${ev(eventId)}/candidates/${id}/assignments`, { method: 'POST', body: { selectorId } }),
    unassign: (eventId, id, selectorId) => request(`${ev(eventId)}/candidates/${id}/assignments/${selectorId}`, { method: 'DELETE' }),
  },
  selectors: {
    list: (eventId) => request(`${ev(eventId)}/selectors`),
    get: (eventId, id) => request(`${ev(eventId)}/selectors/${id}`),
    setActive: (eventId, id, isActive) => request(`${ev(eventId)}/selectors/${id}`, { method: 'PATCH', body: { isActive } }),
  },
  my: {
    dashboard: (eventId) => request(`${ev(eventId)}/my-dashboard`),
    candidates: (eventId, params) => request(`${ev(eventId)}/my-candidates`, { params }),
    candidate: (eventId, id) => request(`${ev(eventId)}/my-candidates/${id}`),
    saveEvaluation: (eventId, id, body) => request(`${ev(eventId)}/candidates/${id}/evaluation`, { method: 'POST', body }),
  },
};
