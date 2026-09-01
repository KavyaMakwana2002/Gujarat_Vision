import React from 'react';
import { AlertTriangle, Siren, ShieldCheck, MapPin, Radio, X } from 'lucide-react';

export default function RedAlertModal({ alertData, onClose, onAcknowledge }) {
  if (!alertData) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl shadow-red-500/30 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Siren */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-500 flex items-center justify-center animate-bounce">
            <Siren className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🚨 GOVERNMENT RED ALERT ACTIVATED
            </h2>
            <p className="text-xs text-red-400 font-mono">High-Priority Stolen / Wanted Vehicle Intercept Alert</p>
          </div>
        </div>

        {/* Details Matrix */}
        <div className="my-5 space-y-3 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 flex items-center justify-between">
            <span className="text-slate-400">TARGET LICENSE PLATE</span>
            <span className="text-xl font-extrabold text-red-400 tracking-wider bg-red-500/10 px-3 py-1 rounded-xl border border-red-500/30">
              {alertData.plate || 'GJ01AB1234'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">DATABASE SOURCE</span>
              <span className="text-slate-200 font-bold">{alertData.database_source || 'VAHAN 4.0 & eGujCop'}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">FIR NUMBER</span>
              <span className="text-amber-400 font-bold">{alertData.fir_number || 'FIR/2026/AHM/4092'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Detected at: <strong>{alertData.location || 'SG Highway Sentinel Post'}</strong></span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (onAcknowledge) onAcknowledge(alertData);
            onClose();
          }}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-red-600/40 transition flex items-center justify-center gap-2"
        >
          <Radio className="w-4 h-4" /> DISPATCH NEAREST HIGHWAY PATROL VAN
        </button>
      </div>
    </div>
  );
}
