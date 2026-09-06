import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import VideoPlayer from '../components/VideoPlayer';
import { Camera, ShieldAlert, Cpu, Car, Shield, Bike, Truck, Bus, Radio, Filter, Layers, Video, ChevronDown, Check } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

import { SENTINEL_CAMERAS } from './CameraMatrixView';
import { TOLL_CAMERAS } from './VideoWallView';

const ALL_MISSION_CAMERAS = [
  ...SENTINEL_CAMERAS,
  ...TOLL_CAMERAS,
  { id: 'webcam', name: 'Laptop / USB Local Camera', city: 'HQ Command' }
];

const VEHICLE_FILTERS = [
  { id: 'ALL', label: 'ALL', icon: Layers },
  { id: 'CAR', label: 'CAR', icon: Car },
  { id: 'BIKE', label: 'BIKE', icon: Bike },
  { id: 'AUTO', label: 'AUTO', icon: Radio },
  { id: 'BUS', label: 'BUS', icon: Bus },
  { id: 'TRUCK', label: 'TRUCK', icon: Truck },
];

export default function DashboardView({ stats, detections, liveAlerts, onConnectCustomStream, activeStreamUrl, activeCamera, onSelectCamera }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const currentCamId = (activeCamera?.id || 'cam01').toLowerCase();
  const currentCameraObj = ALL_MISSION_CAMERAS.find(c => c.id.toLowerCase() === currentCamId) || {
    id: currentCamId,
    name: `Surveillance Node ${currentCamId.toUpperCase()}`,
    city: 'Gujarat Grid'
  };

  const cameraTitle = `${currentCamId.toUpperCase()} • ${currentCameraObj.name} (${currentCameraObj.city})`;

  const handleCycleCamera = (delta) => {
    const digits = (currentCamId.match(/\d+/) || [1])[0];
    let nextNum = parseInt(digits) + delta;
    if (nextNum < 1) nextNum = 30;
    if (nextNum > 30) nextNum = 1;
    const nextId = `cam${String(nextNum).padStart(2, '0')}`;
    const found = ALL_MISSION_CAMERAS.find(c => c.id.toLowerCase() === nextId);
    if (found && onSelectCamera) {
      onSelectCamera(found);
    }
  };

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
          value="60.0 FPS" 
          subtext="Ultra-Low Latency AI Grid" 
          icon={Cpu} 
          color="emerald" 
        />
      </div>

      {/* Quick Camera Switcher Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-3.5 shadow-xl space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold font-mono text-white tracking-wide">MISSION CONTROL CAM SELECTOR:</span>
            <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              ● ACTIVE: {currentCamId.toUpperCase()} ({currentCameraObj.city})
            </span>
          </div>

          {/* Camera Dropdown & Prev/Next for All 30 Cameras */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCycleCamera(-1)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold font-mono transition"
              title="Previous Camera"
            >
              ◀ PREV
            </button>

            <select
              value={currentCamId}
              onChange={(e) => {
                const found = ALL_MISSION_CAMERAS.find(c => c.id.toLowerCase() === e.target.value.toLowerCase());
                if (found && onSelectCamera) {
                  onSelectCamera(found);
                } else if (onSelectCamera) {
                  onSelectCamera({ id: e.target.value, name: `Camera ${e.target.value.toUpperCase()}`, city: 'Gujarat State Grid' });
                }
              }}
              aria-label="Select Active Surveillance Node"
              className="w-full md:w-72 bg-slate-950 text-slate-200 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <optgroup label="🚨 Gujarat Police CCTV Grid (CAM 01 to 30)">
                {SENTINEL_CAMERAS.map(c => (
                  <option key={c.id} value={c.id.toLowerCase()}>
                    {c.id.toUpperCase()}: {c.name} ({c.city})
                  </option>
                ))}
              </optgroup>
              <optgroup label="⚡ NHAI Highway Tollnakas">
                {TOLL_CAMERAS.map(t => (
                  <option key={t.id} value={t.id.toLowerCase()}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="💻 Local Hardware">
                <option value="webcam">Laptop / USB Local Camera</option>
              </optgroup>
            </select>

            <button
              onClick={() => handleCycleCamera(1)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold font-mono transition"
              title="Next Camera"
            >
              NEXT ▶
            </button>
          </div>
        </div>

        {/* Quick Selection Number Grid (1 to 30 Buttons) */}
        <div className="pt-1">
          <div className="text-[10px] text-slate-400 font-mono mb-1.5 flex items-center justify-between">
            <span>Direct 1-Click Camera Select (01 to 30):</span>
            <span className="text-slate-500">Click any number to switch instantly</span>
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-16 lg:grid-cols-30 gap-1 overflow-x-auto pb-1">
            {Array.from({ length: 30 }).map((_, i) => {
              const cid = `cam${String(i + 1).padStart(2, '0')}`;
              const isCurrent = currentCamId === cid;
              const found = SENTINEL_CAMERAS.find(c => c.id === cid);
              return (
                <button
                  key={cid}
                  onClick={() => found && onSelectCamera && onSelectCamera(found)}
                  title={found ? `${cid.toUpperCase()}: ${found.name} (${found.city})` : cid.toUpperCase()}
                  className={`py-1 rounded-lg text-[10px] font-mono font-bold text-center transition border ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/40 ring-1 ring-blue-300 scale-105'
                      : 'bg-slate-950/90 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl flex flex-col h-[480px]">
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
                  key={`det-${d.id || 'scan'}-${d.plate_number || 'plate'}-${i}`} 
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition hover:bg-slate-900/90"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {getVehicleIcon(d.vehicle_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white tracking-wider truncate flex items-center gap-1.5">
                        <span>{d.plate_number || 'UNREADABLE'}</span>
                        <span className="text-[10px] font-normal text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          {d.vehicle_type || 'VEHICLE'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {d.location || 'Gujarat Sentinel Grid'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold block">
                      {d.camera_id || currentCamId.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'NOW'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
                <Car className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
                <p className="text-xs">Scanning live traffic for vehicles...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}