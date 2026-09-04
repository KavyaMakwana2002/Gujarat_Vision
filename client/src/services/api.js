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
  getDetections: (params) => api.get('/api/detections', { params }),
  getLiveDetections: (params) => api.get('/api/detections/live', { params }),
  getLiveAlerts: () => api.get('/api/alerts/live'),
  getWatchlist: () => api.get('/api/watchlist'),
  
  // Stream control
  startCamera: (source = "0") => api.post(`/api/start_camera?source=${encodeURIComponent(source)}`),
  stopCamera: () => api.post('/api/stop_camera'),
  getCameraState: () => api.get('/api/camera_state'),
  setStreamSource: (source) => api.post('/api/set_stream_source', { source }),
  getIngestCatalogue: () => api.get('/api/ingest'),
  connectGateway: (host) => api.post('/api/gateway/connect', { host }),

  // Laptop Camera Live ANPR Scanner
  scanFrame: (payload) => api.post('/api/scanner/ocr_frame', payload),

  // Centralised CCTV Registry & GIS Mapping Model
  getRegistryCameras: (params) => api.get('/api/registry/cameras', { params }),
  onboardCamera: (cameraData) => api.post('/api/registry/onboard', cameraData),
  bulkImportCameras: (cameras) => api.post('/api/registry/bulk_import', { cameras }),
  getGapAnalysisReport: () => api.get('/api/registry/gap_analysis'),
  getExportRegistryUrl: () => `${API_BASE_URL}/api/registry/export`,

  // Model 3: VMS Federation & Middleware Integration Layer
  getFederationOverview: () => api.get('/api/federation/overview'),
  getFederatedSystems: () => api.get('/api/federation/systems'),
  getFederatedEvents: (params) => api.get('/api/federation/events', { params }),
  getCrossSystemCorrelations: () => api.get('/api/federation/correlations'),
  onboardVmsAdapter: (adapterData) => api.post('/api/federation/onboard_adapter', adapterData),
  getFederatedAnalyticsReport: () => api.get('/api/federation/analytics_report'),

  // Auth
  login: (username, password) => api.post('/api/auth/login', { username, password }),
};

export default api;