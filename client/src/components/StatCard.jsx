import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20',
    cyan: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
    red: 'from-red-500/20 to-red-600/5 text-red-400 border-red-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20',
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.blue} border backdrop-blur-md transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-slate-400">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-80" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-2xl font-extrabold text-white tracking-tight font-sans">{value}</h3>
      </div>
      {subtext && <p className="text-[11px] text-slate-400 mt-1 font-mono">{subtext}</p>}
    </div>
  );
}
