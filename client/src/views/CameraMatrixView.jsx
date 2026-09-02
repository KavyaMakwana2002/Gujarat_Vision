import React, { useState } from 'react';
import { Camera, Search, Eye, Radio, ExternalLink, Shield, CheckCircle2, Play } from 'lucide-react';

export const SENTINEL_CAMERAS = [
  { id: "cam01", name: "Chiman bhai Bridge", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam02", name: "Janpath", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam03", name: "O.N.G.C. Office", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam04", name: "Paldi Circle", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam05", name: "Visat teen Rasta", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam06", name: "Timbavadi gate-Junagadh", city: "Junagadh", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam07", name: "hero-showroom-gir-somnath", city: "Gir Somnath", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam08", name: "majewadi-gate-junagadh", city: "Junagadh", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam09", name: "new-bypass-near-by-circle-junagadh-2", city: "Junagadh", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam10", name: "char-chowk-road-2-junagadh", city: "Junagadh", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam11", name: "dolatpara-junagadh", city: "Junagadh", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam12", name: "Tri Mandir Adalaj Tollnaka", city: "Gandhinagar", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam13", name: "CN Vidhyalaya", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam14", name: "Delight RLVD", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam15", name: "Suvidha park", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam16", name: "Visat P2", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam17", name: "Rajkot Bus Port CCTV", city: "Rajkot", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam18", name: "Rajkot CCTV", city: "Rajkot", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam19", name: "KHAPARIA GRAM PANCHAYAT , TALUKA GANDEVI, DISTRICT NAVSARI", city: "Navsari", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam20", name: "Mohanpura", city: "Ahmedabad", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam21", name: "Surat Ring Road Node", city: "Surat", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam22", name: "Vadodara Sayajigunj Tower", city: "Vadodara", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam23", name: "Mehsana Modhera Circle", city: "Mehsana", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam24", name: "Dwarka Coastal Highway Post", city: "Devbhumi Dwarka", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam25", name: "Bhuj Border Highway Node", city: "Kutch", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam26", name: "Bhavnagar Ghogha Circle", city: "Bhavnagar", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam27", name: "Jamnagar Port Road", city: "Jamnagar", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam28", name: "Anand Expressway Toll Plaza", city: "Anand", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam29", name: "Bharuch Narmada Bridge Gate", city: "Bharuch", codec: "H.264", res: "1080p", fps: 30 },
  { id: "cam30", name: "Gujarat State Highway Patrol Node", city: "Statewide", codec: "H.264", res: "1080p", fps: 30 },
];

export const DISTRICTS = [
  { name: 'All Gujarat Grid', count: 30 },
  { name: 'Ahmedabad', count: 9 },
  { name: 'Junagadh', count: 5 },
  { name: 'Rajkot', count: 2 },
  { name: 'Gandhinagar', count: 2 },
  { name: 'Gir Somnath', count: 1 },
  { name: 'Navsari', count: 1 },
  { name: 'Surat', count: 1 },
  { name: 'Vadodara', count: 1 },
  { name: 'Mehsana', count: 1 },
  { name: 'Devbhumi Dwarka', count: 1 },
  { name: 'Kutch', count: 1 },
  { name: 'Bhavnagar', count: 1 },
  { name: 'Jamnagar', count: 1 },
  { name: 'Anand', count: 1 },
  { name: 'Bharuch', count: 1 },
  { name: 'Statewide Patrol', count: 1 },
];

export default function CameraMatrixView({ onSelectCamera }) {
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCameras = SENTINEL_CAMERAS.filter((cam) => {
    const matchesCity = selectedCity === 'All' || cam.city === selectedCity;
    const matchesSearch = 
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" /> Sentinel Camera Grid (30 Operational Nodes)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Live operational RTSP over TCP (103.250.160.189:8554), HLS & WebRTC feeds across Gujarat
          </p>
        </div>

        {/* Search & District Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search cam01, city, node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 outline-none w-48 focus:border-blue-500"
            />
          </div>

          <span className="text-xs font-mono px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            30 NODES ONLINE
          </span>
        </div>
      </div>

      {/* Grid Network Gateway Protocols Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 font-bold mb-1">RTSP OVER TCP (AI INFERENCE)</div>
          <div className="text-cyan-400 text-[11px] truncate">rtsp://103.250.160.189:8554/stream/&lt;id&gt;</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 font-bold mb-1">WEBRTC / WHEP (LOW-LATENCY)</div>
          <div className="text-emerald-400 text-[11px] truncate">http://103.250.160.189:8889/stream/&lt;id&gt;/whep</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 font-bold mb-1">HLS CDN STREAM (WEB / REMOTE)</div>
          <div className="text-amber-400 text-[11px] truncate">https://cctv.corp8.cloud/&lt;id&gt;/index.m3u8</div>
        </div>
      </div>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredCameras.map((cam) => {
          const rtspUrl = `rtsp://103.250.160.189:8554/stream/${cam.id}`;
          const hlsUrl = `https://cctv.corp8.cloud/${cam.id}/index.m3u8`;

          return (
            <div
              key={cam.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 hover:border-blue-500/60 transition group flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs">
                      {cam.id.toUpperCase()}
                    </span>
                    <span className="font-sans text-xs font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                      {cam.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold whitespace-nowrap">
                    100% ONLINE
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  District: <b className="text-slate-300">{cam.city}</b> • {cam.codec} • {cam.res}
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800/80 truncate">
                  {rtspUrl}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href={hlsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-slate-400 hover:text-amber-400 transition flex items-center gap-1"
                  title="Open HLS CDN Stream"
                >
                  <ExternalLink className="w-3 h-3" /> HLS Feed
                </a>
                <button
                  onClick={() => onSelectCamera && onSelectCamera(cam)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Play className="w-3 h-3 fill-current" /> Stream to AI
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
