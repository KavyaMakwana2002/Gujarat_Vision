import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'shadow-[0_0_15px_rgba(59,130,246,0.15)] border-blue-500/30 text-blue-400',
    cyan: 'shadow-[0_0_15px_rgba(6,182,212,0.15)] border-cyan-500/30 text-cyan-400',
    emerald: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/30 text-emerald-400',
    red: 'cyber-glow-red border-red-500/40 text-red-400',
    amber: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-500/30 text-amber-400',
  };

  const bgGradients = {
    blue: 'from-blue-600/10 to-transparent',
    cyan: 'from-cyan-600/10 to-transparent',
    emerald: 'from-emerald-600/10 to-transparent',
    red: 'from-red-600/20 to-red-900/10',
    amber: 'from-amber-600/10 to-transparent',
  };

  return (
    <div className={`relative p-5 rounded-2xl premium-glass border ${colorMap[color] || colorMap.blue} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradients[color] || bgGradients.blue} opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">{label}</span>
        {Icon && <div className={`p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 shadow-inner group-hover:bg-white/10 transition-colors`}>
          <Icon className="w-4 h-4 opacity-90" />
        </div>}
      </div>
      <div className="relative z-10 mt-3 flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">{value}</h3>
      </div>
      {subtext && <p className="relative z-10 text-[11px] text-slate-400 mt-1.5 font-mono tracking-wide">{subtext}</p>}
    </div>
  );
}