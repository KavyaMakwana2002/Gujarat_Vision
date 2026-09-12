import React, { useState } from 'react';
import { AlertTriangle, Siren, ShieldAlert, Zap, Car, Activity, ShieldCheck, Play, MapPin, Radio, Target } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function SmartCityHubView({ activeFeature, activeStreamUrl, detections = [], liveAlerts = [] }) {
  const [simLoading, setSimLoading] = useState(false);

  const simulateAlert = async (type) => {
    setSimLoading(true);
    try {
      if (type === 'sos') {
        await fetch(`${API_BASE_URL}/api/sos/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id: "CAM-0045 (BRTS Corridor)",
            location: "Ahmedabad Navrangpura BRTS Stand"
          })
        });
      }
      // For ambulance and stray, they are handled by python backend dynamically when a photo is shown to webcam.
    } catch (e) {
      console.error(e);
    }
    setSimLoading(false);
  };

  // Determine configuration based on active feature
  let config = {
    title: "",
    icon: null,
    colorTheme: "", // tailwind color prefix
    alertFilterType: "",
    detectionFilter: (d) => false,
    simButtonText: "",
    simAction: ""
  };

  if (activeFeature === 'stray-animal') {
    config = {
      title: "Municipal Stray Animal & Hazard Control Center",
      icon: AlertTriangle,
      colorTheme: "orange",
      alertFilterType: "CIVIC_HAZARD",
      detectionFilter: (d) => d.vehicle_type === 'ANIMAL' || d.plate_number === 'COW' || d.plate_number === 'DOG',
      simButtonText: "Manual Test: Dispatch AMC Team",
      simAction: "stray"
    };
  } else if (activeFeature === 'green-corridor') {
    config = {
      title: "Green Corridor Ambulance Routing Hub",
      icon: Activity,
      colorTheme: "emerald",
      alertFilterType: "GREEN_CORRIDOR",
      detectionFilter: (d) => d.vehicle_type === 'Ambulance' || (d.raw_text && d.raw_text.includes('108')),
      simButtonText: "Manual Test: Trigger Green Corridor",
      simAction: "ambulance"
    };
  } else if (activeFeature === 'sos-safety') {
    config = {
      title: "Women Safety SOS Dispatch Hub",
      icon: Siren,
      colorTheme: "pink",
      alertFilterType: "CRITICAL_SOS",
      detectionFilter: (d) => false, // SOS relies on alerts mostly
      simButtonText: "Manual Test: Trigger SOS Gesture",
      simAction: "sos"
    };
  }

  const Icon = config.icon;
  const filteredAlerts = liveAlerts.filter(a => a.alert_type === config.alertFilterType);
  const filteredDetections = detections.filter(config.detectionFilter);

  // Dynamic classes based on color theme
  const borderClass = `border-${config.colorTheme}-500/30`;
  const textClass = `text-${config.colorTheme}-400`;
  const textTitleClass = `text-${config.colorTheme}-500`;
  const bgClass = `bg-${config.colorTheme}-500/10`;
  const btnClass = `bg-${config.colorTheme}-600 hover:bg-${config.colorTheme}-500 shadow-${config.colorTheme}-600/30`;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border ${borderClass} shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${bgClass} border ${borderClass}`}>
            {Icon && <Icon className={`w-6 h-6 ${textTitleClass}`} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">{config.title}</h1>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-${config.colorTheme}-500 animate-pulse`}></span>
              Live Monitoring Active
            </p>
          </div>
        </div>
        <button
          onClick={() => simulateAlert(config.simAction)}
          disabled={simLoading}
          className={`px-4 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg ${btnClass} disabled:opacity-50`}
        >
          <Zap className="w-4 h-4 fill-current" />
          {simLoading ? "Triggering..." : config.simButtonText}
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Live Stream Section */}
        <div className="flex-[3] flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden relative shadow-2xl">
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur border border-slate-700 rounded-lg flex items-center gap-2 text-xs font-mono">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-slate-200">LIVE FEED</span>
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <img
              src={
                activeFeature === 'stray-animal' 
                  ? `${API_BASE_URL}/api/video_feed?cam_id=c:/Users/KAVYA/OneDrive/Desktop/Gujarat_Cyber_Vision/Animal.mp4&city=Ahmedabad&junction=Stray+Animal+Hotspot` 
                  : activeFeature === 'green-corridor'
                  ? `${API_BASE_URL}/api/video_feed?cam_id=c:/Users/KAVYA/OneDrive/Desktop/Gujarat_Cyber_Vision/Ambulanc.mp4&city=Ahmedabad&junction=Green+Corridor+Route`
                  : activeFeature === 'sos-safety'
                  ? `${API_BASE_URL}/api/video_feed?cam_id=c:/Users/KAVYA/OneDrive/Desktop/Gujarat_Cyber_Vision/Woman Safety.mp4&city=Ahmedabad&junction=Women+Safety+Corridor`
                  : (activeStreamUrl || `${API_BASE_URL}/api/video_feed?cam_id=cam01`)
              }
              alt="Live Feed"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/1280x720/0f172a/334155?text=CAMERA+OFFLINE";
              }}
            />
          </div>
        </div>

        {/* Right Sidebar Logs */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">

          {/* Active Alerts Panel */}
          <div className={`flex-1 flex flex-col rounded-2xl bg-slate-900/80 border ${borderClass} overflow-hidden shadow-xl`}>
            <div className={`p-3 border-b ${borderClass} flex items-center gap-2`}>
              <Siren className={`w-4 h-4 ${textClass}`} />
              <h3 className={`text-sm font-bold ${textClass}`}>Actionable Alerts</h3>
              <span className={`ml-auto px-2 py-0.5 rounded-full ${bgClass} ${textClass} text-[10px] font-bold`}>
                {filteredAlerts.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {filteredAlerts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono text-center px-4">
                  No critical events detected in the current session.
                </div>
              ) : (
                filteredAlerts.map((a, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${borderClass} ${bgClass} space-y-2 relative overflow-hidden group`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${borderClass} ${textClass}`}>
                        {a.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight">{a.action_required}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{a.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detections Log Panel (if applicable) */}
          {activeFeature !== 'sos-safety' && (
            <div className="flex-1 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-700/50 overflow-hidden">
              <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-300">Detection Log</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredDetections.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono text-center">
                    Awaiting target objects in camera view...
                  </div>
                ) : (
                  filteredDetections.map((d, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-slate-800/50 flex items-center justify-between group hover:bg-slate-800 transition">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">{d.vehicle_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(d.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${borderClass} ${textClass}`}>
                        {d.plate_number || d.raw_text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
