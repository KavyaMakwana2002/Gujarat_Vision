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
    <header className="h-16 border-b border-slate-800 bg-[#030712]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight text-white font-sans">
              SENTINEL SHIELD <span className="text-blue-500">2.4</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE MATRIX
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Gujarat Police Cyber & Traffic Surveillance Grid (80,000 Nodes)</p>
        </div>
      </div>

      {/* Center Telemetry */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>TCP TRANSPORT: <strong className="text-cyan-400">ENFORCED</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>FPS: <strong className="text-emerald-400">73.5 FPS</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time}</span>
        </div>
      </div>

      {/* Officer Profile & Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
            {officerName.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="font-bold text-slate-200 text-xs leading-none">{officerName}</p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{officerBadge}</p>
          </div>
        </div>
      </div>
    </header>
  );
}