import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'border-blue-500/40 text-blue-400 accent-glow-blue',
    cyan: 'border-cyan-500/40 text-cyan-400 accent-glow-cyan',
    emerald: 'border-emerald-500/40 text-emerald-400 accent-glow-green',
    red: 'border-red-500/60 text-red-400 accent-glow-red',
    amber: 'border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
  };

  const bgGradients = {
    blue: 'from-blue-900/40 via-blue-900/10 to-transparent',
    cyan: 'from-cyan-900/40 via-cyan-900/10 to-transparent',
    emerald: 'from-emerald-900/40 via-emerald-900/10 to-transparent',
    red: 'from-red-900/50 via-red-900/20 to-transparent',
    amber: 'from-amber-900/40 via-amber-900/10 to-transparent',
  };

  return (
    <div className={`relative p-6 rounded-2xl premium-glass border ${colorMap[color] || colorMap.blue} transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5)] overflow-hidden group animate-fade-in`}>
      {/* Sweeping background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradients[color] || bgGradients.blue} opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
      
      {/* Decorative top-left corner piece */}
      <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${colorMap[color].split(' ')[0]} rounded-tl-2xl opacity-50 group-hover:scale-110 transition-transform duration-500 origin-top-left`} />
      
      {/* Decorative bottom-right corner piece */}
      <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${colorMap[color].split(' ')[0]} rounded-br-2xl opacity-50 group-hover:scale-110 transition-transform duration-500 origin-bottom-right`} />
      
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">{label}</span>
        {Icon && <div className={`p-2.5 rounded-xl bg-slate-900/80 border border-slate-600/50 shadow-inner group-hover:bg-slate-800 transition-colors`}>
          <Icon className="w-5 h-5 opacity-90 group-hover:scale-110 transition-transform duration-300" />
        </div>}
      </div>
      <div className="relative z-10 mt-4 flex items-baseline gap-2">
        <h3 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">{value}</h3>
      </div>
      {subtext && <p className="relative z-10 text-[11px] text-slate-400 mt-2 font-mono tracking-widest uppercase opacity-80">{subtext}</p>}
    </div>
  );
}