import React, { useState } from 'react';
import { Camera, Radio, RefreshCw, Maximize2, Shield } from 'lucide-react';

export default function VideoPlayer({ streamUrl, title = "Live Surveillance Feed", badge = "AI ANPR ACTIVE" }) {
  const [key, setKey] = useState(Date.now());
  const [fullscreen, setFullscreen] = useState(false);

  const handleRefresh = () => {
    setKey(Date.now());
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white font-mono">{title}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
            {badge}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span>TCP: <strong className="text-emerald-400">LOCKED</strong></span>
          <button 
            onClick={handleRefresh}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Screen */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
        <img
          key={key}
          src={streamUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';
          }}
        />

        {/* Scanlines & HUD */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          <span>GUJARAT POLICE SENTINEL AI</span>
        </div>
      </div>
    </div>
  );
}
