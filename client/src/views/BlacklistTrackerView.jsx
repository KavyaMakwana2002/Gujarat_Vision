import React from 'react';
import { Crosshair, Radio, Shield, MapPin } from 'lucide-react';

export default function BlacklistTrackerView() {
  const targets = [
    { plate: "GJ01AB1234", category: "Robbery Suspect", lastSeen: "Ahmedabad SG Highway Post #1", speed: "78 km/h", direction: "Northbound (towards Gandhinagar)", pcr: "PCR GJ-01-POL-04 (0.8 km)" },
    { plate: "GJ05CD5678", category: "Stolen Vehicle", lastSeen: "Surat Ring Road Toll #3", speed: "62 km/h", direction: "Southbound", pcr: "PCR GJ-05-POL-11 (1.2 km)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-rose-500" /> Blacklist Target Live Intercept & GPS Tracker
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Real-time vehicle movement vectoring, speed monitoring, and PCR patrol interception
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.map((t, i) => (
          <div key={i} className="rounded-2xl bg-slate-900/90 border border-rose-500/30 p-5 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-base font-extrabold text-rose-400 tracking-wider bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
                {t.plate}
              </span>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                {t.category}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between"><span className="text-slate-500">LAST SEEN:</span><span className="text-white font-bold">{t.lastSeen}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">MEASURED SPEED:</span><span className="text-emerald-400 font-bold">{t.speed}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">HEADING:</span><span className="text-slate-200">{t.direction}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ASSIGNED PCR:</span><span className="text-cyan-400 font-bold">{t.pcr}</span></div>
            </div>

            <button
              onClick={() => alert(`🚨 Live Intercept Siren sent to ${t.pcr} for ${t.plate}!`)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 mt-2"
            >
              <Radio className="w-4 h-4" /> Vector Nearest Patrol Intercept
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
