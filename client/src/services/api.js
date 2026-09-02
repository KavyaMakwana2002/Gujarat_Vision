import axios from 'axios';

export const API_BASE_URL = (() => {
  // If running on localhost / 127.0.0.1 in browser, use local backend by default
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8000';
  }
  // If deployed to production (e.g. Vercel), use VITE_API_URL or Render
  return import.meta.env.VITE_API_URL || 'https://gujarat-vision-1.onrender.com';
})();

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
  startCamera: (source = "0") => api.post(`/api/start_camera?source=${encodeURIComponent(source)}`),
  stopCamera: () => api.post('/api/stop_camera'),
  getCameraState: () => api.get('/api/camera_state'),
  setStreamSource: (source) => api.post('/api/set_stream_source', { source }),
  getIngestCatalogue: () => api.get('/api/ingest'),
  connectGateway: (host) => api.post('/api/gateway/connect', { host }),

  // Remote NVR (COREPRIX / VPN)
  getRemoteNVRStatus: () => api.get('/api/remote_nvr/status'),
  configureRemoteNVR: (config) => api.post('/api/remote_nvr/configure', config),

  // Centralised CCTV Registry & GIS Mapping Model
  getRegistryCameras: (params) => api.get('/api/registry/cameras', { params }),
  onboardCamera: (cameraData) => api.post('/api/registry/onboard', cameraData),
  bulkImportCameras: (cameras) => api.post('/api/registry/bulk_import', { cameras }),
  getGapAnalysisReport: () => api.get('/api/registry/gap_analysis'),
  getExportRegistryUrl: () => `${API_BASE_URL}/api/registry/export`,

  // Auth
  login: (username, password) => api.post('/api/auth/login', { username, password }),
};

export default api;
