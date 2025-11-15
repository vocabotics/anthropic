import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth state
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),
};

export const projectsApi = {
  list: () => api.get('/projects'),

  get: (id: string) => api.get(`/projects/${id}`),

  create: (data: any) => api.post('/projects', data),

  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const keysApi = {
  list: (provider?: string) =>
    api.get('/keys', { params: { provider } }),

  create: (data: {
    provider: 'openrouter' | 'github' | 'stripe';
    apiKey: string;
    name?: string;
    description?: string;
  }) => api.post('/keys', data),

  update: (id: string, data: any) => api.patch(`/keys/${id}`, data),

  delete: (id: string) => api.delete(`/keys/${id}`),

  validate: (data: { provider: string; apiKey: string }) =>
    api.post('/keys/validate', data),
};

export const githubApi = {
  getUser: () => api.get('/github/user'),

  listRepos: (page: number = 1, perPage: number = 30) =>
    api.get('/github/repos', { params: { page, perPage } }),

  createRepo: (data: any) => api.post('/github/repos', data),

  createCommit: (data: any) => api.post('/github/commits', data),

  createPR: (data: any) => api.post('/github/pulls', data),
};

export const executeApi = {
  execute: (data: {
    projectId: string;
    code: string;
    language: 'javascript' | 'typescript' | 'python';
    timeout?: number;
    environment?: Record<string, string>;
  }) => api.post('/execute', data),

  test: (language: 'javascript' | 'typescript' | 'python') =>
    api.get(`/execute/test/${language}`),

  info: () => api.get('/execute/info'),
};
