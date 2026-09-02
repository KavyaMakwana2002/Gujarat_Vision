import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RedAlertModal from './components/RedAlertModal';

// 11 Application Views
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

import { surveillanceService, API_BASE_URL } from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({ total_cameras: 80000, total_vehicles: 14820, active_alerts: 3 });
  const [detections, setDetections] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeRedAlert, setActiveRedAlert] = useState(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState(`${API_BASE_URL}/api/video_feed`);

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
      case 'camera-matrix':
        return (
          <CameraMatrixView 
            onSelectCamera={async (cam) => {
              try {
                await surveillanceService.setStreamSource(cam.id);
              } catch (e) {}
              setActiveStreamUrl(`${API_BASE_URL}/api/video_feed?cam_id=${cam.id}&city=${encodeURIComponent(cam.city)}&t=${Date.now()}`);
              setActiveView('dashboard');
            }} 
          />
        );
      case 'live-location':
        return (
          <LiveLocationView 
            onSelectHub={() => setActiveView('camera-matrix')} 
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
        return <DashboardView stats={stats} detections={detections} liveAlerts={liveAlerts} />;
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
        {/* Left Sidebar */}
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
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
