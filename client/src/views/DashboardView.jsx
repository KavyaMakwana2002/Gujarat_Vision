import React from 'react';
import StatCard from '../components/StatCard';
import VideoPlayer from '../components/VideoPlayer';
import { Camera, ShieldAlert, CheckCircle2, Cpu, Car, Shield } from 'lucide-react';

export default function DashboardView({ stats, detections, liveAlerts, onConnectCustomStream, activeStreamUrl }) {
  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="TOTAL NETWORK CAMERAS" 
          value="80,000" 
          subtext="Gujarat State Matrix (33 Districts)" 
          icon={Camera} 
          color="blue" 
        />
        <StatCard 
          label="ACTIVE LIVE DETECTIONS" 
          value={stats?.total_vehicles || 14820} 
          subtext="YOLOv8 + ByteTrack Active" 
          icon={Car} 
          color="cyan" 
        />
        <StatCard 
          label="SECURITY RED ALERTS" 
          value={liveAlerts?.length || 3} 
          subtext="Stolen/Hotlisted Matches" 
          icon={ShieldAlert} 
          color="red" 
        />
        <StatCard 
          label="AI ENGINE STATUS" 
          value="73.5 FPS" 
          subtext="DirectShow / TCP Low Latency" 
          icon={Cpu} 
          color="emerald" 
        />
      </div>

      {/* Main Stream Player & Live Feed Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer 
            streamUrl={activeStreamUrl || "http://127.0.0.1:8000/api/video_feed"} 
            title="Gujarat State Highway (Node #1 - SG Highway Post)" 
            badge="LIVE AI VEHICLE & ANPR SCAN" 
          />
        </div>

        {/* Live Detections Feed Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl flex flex-col h-[420px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> LIVE VEHICLE SCAN LOG
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              REAL-TIME
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {detections && detections.length > 0 ? (
              detections.slice(0, 15).map((d, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
                  <div>
                    <span className="text-slate-300 font-bold text-xs uppercase">{d.vehicle_type}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{d.location || 'SG Highway Corridor'}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-extrabold tracking-wider">
                    {d.plate_number || 'GJ01XX0000'}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Scanning incoming stream for license plates...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
