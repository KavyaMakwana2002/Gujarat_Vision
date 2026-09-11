import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Clock, User, LogOut, CheckCircle2 } from 'lucide-react';

export default function Navbar({ onLogout, officerName = "Officer Admin", officerBadge = "GJ-POL-007" }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-[72px] premium-glass px-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl shadow-blue-900/5 mx-6 mt-4 mb-2 rounded-2xl">
      {/* Brand Title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center cyber-glow-blue border border-blue-400/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-extrabold text-lg tracking-wide text-white font-sans drop-shadow-md">
              SENTINEL SHIELD <span className="text-gradient-cyan">2.4</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">Gujarat Police Cyber Command (80,000 Nodes)</p>
        </div>
      </div>

      {/* Center Telemetry */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 shadow-inner">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>TRANSPORT: <strong className="text-cyan-400 tracking-wider">SECURE TCP</strong></span>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 shadow-inner">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>ENGINE: <strong className="text-emerald-400 tracking-wider">73.5 FPS</strong></span>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 shadow-inner">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="tracking-widest">{time}</span>
        </div>
      </div>

      {/* Officer Profile & Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-xs shadow-inner cursor-pointer hover:bg-slate-800/80 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/30 to-cyan-500/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            {officerName.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="font-bold text-slate-100 text-[13px] leading-tight tracking-wide">{officerName}</p>
            <p className="text-[10px] font-mono text-cyan-400/80 tracking-widest mt-0.5">{officerBadge}</p>
          </div>
        </div>
      </div>
    </header>
  );
}