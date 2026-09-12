import React, { useState, useEffect } from 'react';
import { Siren, ShieldAlert, Zap, Target, Activity, AlertTriangle, Eye, Video } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function WomenSafetyView() {
  const [simLoading, setSimLoading] = useState(false);
  const [threatLogs, setThreatLogs] = useState([]);
  
  // Dummy AI analysis events to make it look "alive"
  useEffect(() => {
    const logs = [
      "Scanning perimeter for isolated subjects...",
      "Subject detected: Female, tracking trajectory.",
      "Lighting conditions optimal. No suspicious grouping detected.",
      "Analyzing body language for distress indicators..."
    ];
    let idx = 0;
    const iv = setInterval(() => {
      setThreatLogs(prev => [
        { id: Date.now(), text: logs[idx % logs.length], time: new Date().toLocaleTimeString() },
        ...prev
      ].slice(0, 5));
      idx++;
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const triggerSOS = async () => {
    setSimLoading(true);
    try {
      // Add a critical threat log
      setThreatLogs(prev => [
        { id: Date.now(), text: "🚨 CRITICAL: Distress Gesture (SOS) Detected!", time: new Date().toLocaleTimeString(), isCritical: true },
        ...prev
      ].slice(0, 5));
      
      await fetch(`${API_BASE_URL}/api/sos/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: "CAM-SOS-009 (Women Safety Corridor)",
          location: "Ahmedabad Navrangpura BRTS Stand"
        })
      });
    } catch (e) {
      console.error(e);
    }
    setSimLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/30">
            <Siren className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">Women Safety SOS & Threat Detection Hub</h1>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              Live Monitoring & Threat Analysis Active
            </p>
          </div>
        </div>
        <button
          onClick={triggerSOS}
          disabled={simLoading}
          className="px-6 py-3 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(236,72,153,0.4)] bg-pink-600 hover:bg-pink-500 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <AlertTriangle className="w-5 h-5 fill-current" />
          {simLoading ? "Triggering SOS..." : "TRIGGER CRITICAL SOS"}
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Live Stream Section */}
        <div className="flex-[3] flex flex-col bg-slate-900/50 rounded-2xl border border-pink-500/20 overflow-hidden relative shadow-2xl">
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur border border-pink-500/50 rounded-lg flex items-center gap-2 text-xs font-mono">
            <Video className="w-4 h-4 text-pink-500 animate-pulse" />
            <span className="text-pink-100">CAM-SOS-009 LIVE</span>
          </div>

          <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur border border-slate-700 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-300">
            <Eye className="w-4 h-4 text-emerald-400" />
            AI OVERLAY: ACTIVE
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video
              src="/evidence/Woman Safety.mp4"
              className="w-full h-full object-cover opacity-90"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjV2MWg0MHYtMUgweiIgZmlsbD0icmdiYSgyMzYsIDcyLCAxNTMsIDAuMSkiLz48cGF0aCBkPSJNMzkuNSAwdi0xaDF2NDBoLTFWMHoiIGZpbGw9InJnYmEoMjM2LCA3MiwgMTUzLCAwLjEpIi8+PC9zdmc+')] opacity-50"></div>
          </div>
        </div>

        {/* Right Sidebar Logs */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex-1 flex flex-col rounded-2xl bg-slate-900/80 border border-pink-500/30 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-pink-500/30 flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-400" />
              <h3 className="text-sm font-bold text-pink-400 tracking-wider">AI Threat Analysis Log</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {threatLogs.map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border ${log.isCritical ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-800/50 border-slate-700/50'} relative overflow-hidden group transition-all duration-300`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${log.isCritical ? 'bg-red-500 text-white border-red-600' : 'bg-slate-900 border-slate-600 text-slate-400'}`}>
                      {log.isCritical ? 'CRITICAL ALERT' : 'SYSTEM LOG'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                  <p className={`text-xs font-semibold ${log.isCritical ? 'text-red-400' : 'text-slate-300'} leading-relaxed mt-2`}>
                    {log.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
