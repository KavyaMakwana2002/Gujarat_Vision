import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RedAlertModal from './components/RedAlertModal';

// Views
import DashboardView from './views/DashboardView';
import CameraMatrixView from './views/CameraMatrixView';
import LiveLocationView from './views/LiveLocationView';
import GisMapView from './views/GisMapView';
import VehicleRegistryView from './views/VehicleRegistryView';
import VehicleSearchView from './views/VehicleSearchView';
import EvidenceVaultView from './views/EvidenceVaultView';
import AllAlertsView from './views/AllAlertsView';
import StolenRegistryView from './views/StolenRegistryView';
import BlacklistTrackerView from './views/BlacklistTrackerView';
import RemoteNvrView from './views/RemoteNvrView';
import CctvRegistryView from './views/CctvRegistryView';
import VideoWallView from './views/VideoWallView';

import { surveillanceService, API_BASE_URL } from './services/api';

const VALID_VIEWS = [
  'dashboard',
  'registry',
  'video-wall',
  'camera-matrix',
  'live-location',
  'gis-map',
  'vehicle-details',
  'vehicle-search',
  'record-video',
  'all-alerts',
  'stolen-cars',
  'blacklist-loc',
  'remote-nvr'
];

export default function App() {
  // 1. Read initial view cleanly from pathname or localStorage (WITHOUT any # hash)
  const getInitialView = () => {
    // If URL has an old hash, convert it to clean path and clean history
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim();
      if (VALID_VIEWS.includes(cleanHash)) {
        window.history.replaceState(null, '', `/${cleanHash}`);
        localStorage.setItem('sentinel_active_view', cleanHash);
        return cleanHash;
      }
    }

    // Clean pathname e.g. "/live-location" -> "live-location"
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').split('?')[0].trim();
    if (VALID_VIEWS.includes(path)) {
      localStorage.setItem('sentinel_active_view', path);
      return path;
    }

    // Fallback to localStorage saved state
    const saved = localStorage.getItem('sentinel_active_view');
    if (saved && VALID_VIEWS.includes(saved)) {
      const targetPath = saved === 'dashboard' ? '/' : `/${saved}`;
      window.history.replaceState(null, '', targetPath);
      return saved;
    }

    return 'dashboard';
  };

  const getInitialStreamUrl = () => {
    const savedStream = localStorage.getItem('sentinel_active_stream');
    return savedStream || `${API_BASE_URL}/api/video_feed`;
  };

  const [activeView, setActiveView] = useState(getInitialView);
  const [stats, setStats] = useState({ total_cameras: 80000, total_vehicles: 14820, active_alerts: 3 });
  const [detections, setDetections] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeRedAlert, setActiveRedAlert] = useState(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState(getInitialStreamUrl);

  // 2. Clean HTML5 Path Navigation (No hash)
  const handleNavigate = (view) => {
    if (!VALID_VIEWS.includes(view)) return;
    setActiveView(view);
    localStorage.setItem('sentinel_active_view', view);
    const targetPath = view === 'dashboard' ? '/' : `/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
  };

  // 3. Listen to browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').split('?')[0].trim();
      const currentView = VALID_VIEWS.includes(path) ? path : 'dashboard';
      setActiveView(currentView);
      localStorage.setItem('sentinel_active_view', currentView);
    };

    // Ensure clean URL without hash on mount
    if (window.location.hash) {
      const targetPath = activeView === 'dashboard' ? '/' : `/${activeView}`;
      window.history.replaceState(null, '', targetPath);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView]);

  // Poll backend endpoints
  const fetchSurveillanceData = async () => {
    try {
      const [statsRes, detRes, alertsRes] = await Promise.allSettled([
        surveillanceService.getStats(),
        surveillanceService.getDetections(),
        surveillanceService.getLiveAlerts(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
      if (detRes.status === 'fulfilled' && detRes.value.data) {
        setDetections(detRes.value.data);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data) {
        setLiveAlerts(alertsRes.value.data);
      }
    } catch (err) {
      console.warn('Backend polling error:', err);
    }
  };

  useEffect(() => {
    fetchSurveillanceData();
    const interval = setInterval(fetchSurveillanceData, 2500);
    return () => clearInterval(interval);
  }, []);

  // View Router
  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView 
            stats={stats} 
            detections={detections} 
            liveAlerts={liveAlerts}
            activeStreamUrl={activeStreamUrl}
          />
        );
      case 'registry':
        return (
          <CctvRegistryView 
            onSelectCamera={(cam) => {
              handleNavigate('camera-matrix');
            }}
          />
        );
      case 'video-wall':
        return <VideoWallView />;
      case 'camera-matrix':
        return (
          <CameraMatrixView 
            onSelectCamera={async (cam) => {
              try {
                await surveillanceService.setStreamSource(cam.id);
              } catch (e) {}
              const streamUrl = `${API_BASE_URL}/api/video_feed?cam_id=${cam.id}&city=${encodeURIComponent(cam.city)}&t=${Date.now()}`;
              setActiveStreamUrl(streamUrl);
              localStorage.setItem('sentinel_active_stream', streamUrl);
              handleNavigate('dashboard');
            }} 
          />
        );
      case 'live-location':
        return (
          <LiveLocationView 
            onSelectHub={() => handleNavigate('camera-matrix')} 
          />
        );
      case 'gis-map':
        return <GisMapView />;
      case 'vehicle-details':
        return <VehicleRegistryView />;
      case 'vehicle-search':
        return <VehicleSearchView detections={detections} />;
      case 'record-video':
        return <EvidenceVaultView />;
      case 'all-alerts':
        return <AllAlertsView alerts={liveAlerts} />;
      case 'stolen-cars':
        return <StolenRegistryView />;
      case 'blacklist-loc':
        return <BlacklistTrackerView />;
      case 'remote-nvr':
        return <RemoteNvrView />;
      default:
        return (
          <DashboardView 
            stats={stats} 
            detections={detections} 
            liveAlerts={liveAlerts}
            activeStreamUrl={activeStreamUrl}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        officerName="Officer Admin" 
        officerBadge="GJ-POL-007" 
        onLogout={() => alert("Officer Logged Out Successfully")}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar with Clean HTML5 Routing */}
        <Sidebar 
          activeView={activeView} 
          setActiveView={handleNavigate} 
          onLogout={() => alert("Officer Logged Out Successfully")}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-4rem)] bg-gradient-to-b from-[#030712] via-[#080d1e] to-[#030712]">
          {renderCurrentView()}
        </main>
      </div>

      {/* Red Alert Siren Modal */}
      {activeRedAlert && (
        <RedAlertModal 
          alertData={activeRedAlert} 
          onClose={() => setActiveRedAlert(null)}
          onAcknowledge={(alert) => {
            alert(`🚨 PCR Patrol Van Vector Dispatched to Intercept ${alert.plate}!`);
          }}
        />
      )}
    </div>
  );
}
