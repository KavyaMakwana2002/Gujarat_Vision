import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const surveillanceService = {
  // Stats & Ingestion
  getStats: () => api.get('/api/stats'),
  getDetections: () => api.get('/api/detections'),
  getLiveAlerts: () => api.get('/api/alerts/live'),
  getWatchlist: () => api.get('/api/watchlist'),
  
  // Stream control
  setStreamSource: (source) => api.post('/api/set_stream_source', { source }),
  getIngestCatalogue: () => api.get('/api/ingest'),
  connectGateway: (host) => api.post('/api/gateway/connect', { host }),

  // Remote NVR (COREPRIX / VPN)
  getRemoteNVRStatus: () => api.get('/api/remote_nvr/status'),
  configureRemoteNVR: (config) => api.post('/api/remote_nvr/configure', config),

  // Auth
  login: (username, password) => api.post('/api/auth/login', { username, password }),
};

export default api;
