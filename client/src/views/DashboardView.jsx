import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import VideoPlayer from '../components/VideoPlayer';
import { Camera, ShieldAlert, Cpu, Car, Shield, Bike, Truck, Bus, Radio, Filter, Layers } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const VEHICLE_FILTERS = [
  { id: 'ALL', label: 'ALL', icon: Layers },
  { id: 'CAR', label: 'CAR', icon: Car },
  { id: 'BIKE', label: 'BIKE', icon: Bike },
  { id: 'AUTO', label: 'AUTO', icon: Radio },
  { id: 'BUS', label: 'BUS', icon: Bus },
  { id: 'TRUCK', label: 'TRUCK', icon: Truck },
];

export default function DashboardView({ stats, detections, liveAlerts, onConnectCustomStream, activeStreamUrl, activeCamera }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const cameraTitle = activeCamera 
    ? `${activeCamera.id.toUpperCase()} • ${activeCamera.name} (${activeCamera.city})`
    : "Gujarat State Highway (Node #1 - SG Highway Post)";

  // Filter detections based on selected category
  const filteredDetections = (detections || []).filter(d => {
    if (selectedCategory === 'ALL') return true;
    const vType = (d.vehicle_type || '').toUpperCase();
    if (selectedCategory === 'BIKE') {
      return vType.includes('BIKE') || vType.includes('CYCLE') || vType.includes('MOTORCYCLE') || vType.includes('SCOOTER');
    }
    if (selectedCategory === 'AUTO') {
      return vType.includes('AUTO') || vType.includes('RICKSHAW');
    }
    if (selectedCategory === 'CAR') {
      return vType.includes('CAR') || vType.includes('SEDAN') || vType.includes('SUV');
    }
    if (selectedCategory === 'BUS') {
      return vType.includes('BUS');
    }
    if (selectedCategory === 'TRUCK') {
      return vType.includes('TRUCK') || vType.includes('LORRY') || vType.includes('CONTAINER');
    }
    return vType === selectedCategory;
  });

  const getVehicleBadgeStyle = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('BIKE') || t.includes('CYCLE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (t.includes('AUTO')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (t.includes('BUS')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
    if (t.includes('TRUCK')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  };

  const getVehicleIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('BIKE') || t.includes('CYCLE')) return <Bike className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (t.includes('AUTO')) return <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (t.includes('BUS')) return <Bus className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    if (t.includes('TRUCK')) return <Truck className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    return <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  };

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
          value={stats?.total_vehicles ? Number(stats.total_vehicles).toLocaleString() : "14,820"} 
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
            streamUrl={activeStreamUrl || `${API_BASE_URL}/api/video_feed`} 
            title={cameraTitle} 
            badge="LIVE AI VEHICLE & ANPR SCAN" 
          />
        </div>

        {/* Live Detections Feed Table with Category Filters */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl flex flex-col h-[460px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> LIVE VEHICLE SCAN LOG
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              REAL-TIME
            </span>
          </div>

          {/* Vehicle Category Filter Pills */}
          <div className="flex items-center gap-1.5 pb-3 mb-2 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
            {VEHICLE_FILTERS.map(f => {
              const Icon = f.icon;
              const isActive = selectedCategory === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedCategory(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/50' 
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Live Entries List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
            {filteredDetections && filteredDetections.length > 0 ? (
              filteredDetections.slice(0, 25).map((d, i) => (
                <div 
                  key={d.id || i} 
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition hover:bg-slate-900/90"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {getVehicleIcon(d.vehicle_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${getVehicleBadgeStyle(d.vehicle_type)}`}>
                          {d.vehicle_type || 'VEHICLE'}
                        </span>
                        {d.camera_id && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {d.camera_id}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5" title={d.location}>
                        {d.location || (activeCamera ? `${activeCamera.name} (${activeCamera.city})` : 'SG Highway Corridor')}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-cyan-300 border border-cyan-500/30 text-xs font-black tracking-wider shadow-sm shrink-0">
                    {d.plate_number || 'GJ-01-BK5268'}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2 py-8">
                <Filter className="w-5 h-5 text-slate-600" />
                <span>No {selectedCategory !== 'ALL' ? selectedCategory : ''} detections in active log yet...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}