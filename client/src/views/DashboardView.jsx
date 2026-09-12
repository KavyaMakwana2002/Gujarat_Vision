import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import VideoPlayer from '../components/VideoPlayer';
import { Camera, ShieldAlert, Cpu, Car, Shield, Bike, Truck, Bus, Radio, Filter, Layers, Video, ChevronDown, Check, Activity } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

  const hourlyData = [
    { time: '00:00', traffic: 120, violations: 12 },
    { time: '04:00', traffic: 80, violations: 5 },
    { time: '08:00', traffic: 450, violations: 45 },
    { time: '12:00', traffic: 600, violations: 68 },
    { time: '16:00', traffic: 550, violations: 50 },
    { time: '20:00', traffic: 300, violations: 25 },
    { time: '23:59', traffic: 150, violations: 15 },
  ];

  const incidentData = [
    { name: 'Over-Speeding', value: 400, color: '#0ea5e9' }, // sky-500
    { name: 'Red Light Jump', value: 300, color: '#f59e0b' }, // amber-500
    { name: 'Wrong Side', value: 200, color: '#ef4444' }, // red-500
    { name: 'SOS/Hazard', value: 50, color: '#ec4899' }, // pink-500
  ];

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
      <div className="rounded-2xl border border-slate-700/50 premium-glass p-4 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <Video className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold font-mono text-slate-300 tracking-widest uppercase">Mission Control Target</span>
              <span className="text-[13px] font-mono text-cyan-400 font-bold flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                {currentCamId.toUpperCase()} <span className="text-slate-400 font-normal">({currentCameraObj.city})</span>
              </span>
            </div>
          </div>

          {/* Camera Dropdown & Prev/Next for All 30 Cameras */}
          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50 shadow-inner">
            <button
              onClick={() => handleCycleCamera(-1)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600/50 text-xs font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] active:scale-95"
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
              className="w-full md:w-[320px] bg-slate-950/80 text-slate-200 border border-slate-700/80 rounded-lg px-4 py-2 text-[13px] font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer shadow-inner appearance-none custom-scrollbar"
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
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600/50 text-xs font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] active:scale-95"
              title="Next Camera"
            >
              NEXT ▶
            </button>
          </div>
        </div>

        {/* Quick Selection Number Grid (1 to 30 Buttons) */}
        <div className="pt-2 border-t border-slate-700/30 relative z-10">
          <div className="text-[10px] text-slate-400 font-mono mb-2.5 flex items-center justify-between">
            <span className="tracking-widest uppercase font-bold text-slate-500">Fast Tactical Switch:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {Array.from({ length: 30 }).map((_, i) => {
              const cid = `cam${String(i + 1).padStart(2, '0')}`;
              const isCurrent = currentCamId === cid;
              const found = SENTINEL_CAMERAS.find(c => c.id === cid);
              return (
                <button
                  key={cid}
                  onClick={() => found && onSelectCamera && onSelectCamera(found)}
                  title={found ? `${cid.toUpperCase()}: ${found.name} (${found.city})` : cid.toUpperCase()}
                  className={`w-9 h-8 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center transition-all duration-300 border ${isCurrent
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-110 z-10'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-700/50 hover:border-slate-500 hover:shadow-lg'
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
        <div className="lg:col-span-2 relative">
          {/* Tactical Bezel Container */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-600/20 rounded-2xl blur opacity-50"></div>
          <div className="relative h-full rounded-2xl border border-slate-700/60 bg-black overflow-hidden shadow-2xl">
            <VideoPlayer
              streamUrl={activeStreamUrl || `${API_BASE_URL}/api/video_feed`}
              title={cameraTitle}
              badge="LIVE AI SCAN"
            />
          </div>
        </div>

        {/* Live Detections Feed Table with Category Filters */}
        <div className="rounded-2xl border border-slate-700/50 premium-glass p-5 shadow-2xl flex flex-col h-[520px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
            <h3 className="text-[13px] font-bold text-white font-mono tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> INTERCEPT LOG
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              REAL-TIME
            </span>
          </div>

          {/* Vehicle Category Filter Pills */}
          <div className="relative z-10 flex items-center gap-2 pb-4 mb-3 border-b border-slate-700/40 overflow-x-auto custom-scrollbar">
            {VEHICLE_FILTERS.map(f => {
              const Icon = f.icon;
              const isActive = selectedCategory === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedCategory(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-2 transition-all duration-300 whitespace-nowrap ${isActive
                      ? 'bg-cyan-600/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-cyan-400/40 scale-105'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'opacity-70'}`} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Live Entries List */}
          <div className="relative z-10 flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs custom-scrollbar">
            {filteredDetections && filteredDetections.length > 0 ? (
              filteredDetections.slice(0, 25).map((d, i) => (
                <div
                  key={`det-${d.id || 'scan'}-${d.plate_number || 'plate'}-${i}`}
                  className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40 flex items-center justify-between hover:border-slate-500/50 hover:bg-slate-800/60 transition-all duration-300 group shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {getVehicleIcon(d.vehicle_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 tracking-wider truncate flex items-center gap-2 text-[13px]">
                        <span>{d.plate_number || 'UNREADABLE'}</span>
                        <span className="text-[9px] font-bold tracking-widest text-cyan-300 bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-500/20">
                          {d.vehicle_type || 'VEHICLE'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400/80 truncate mt-1 tracking-wide">
                        {d.location || 'Gujarat Sentinel Grid'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-600 text-slate-300 font-bold block shadow-inner">
                      {d.camera_id || currentCamId.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1 tracking-widest font-bold group-hover:text-cyan-400/70 transition-colors">
                      {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'NOW'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500/50 py-8">
                <Car className="w-10 h-10 mb-3 opacity-30 animate-pulse" />
                <p className="text-xs tracking-widest uppercase">Scanning Live Feed...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        {/* Area Chart: Traffic vs Violations */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 premium-glass p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
            <h3 className="text-[13px] font-bold text-white font-mono tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> 24-HOUR TRAFFIC FLOW VS VIOLATIONS
            </h3>
          </div>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="traffic" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" name="Total Vehicles" />
                <Area type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorViolations)" name="Violations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Incident Distribution */}
        <div className="rounded-2xl border border-slate-700/50 premium-glass p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
            <h3 className="text-[13px] font-bold text-white font-mono tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> INCIDENT DISTRIBUTION
            </h3>
          </div>
          <div className="h-[250px] w-full relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {incidentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 flex flex-col gap-3 pr-4 pointer-events-none">
              {incidentData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-[10px] text-slate-300 font-mono font-bold tracking-wider">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}