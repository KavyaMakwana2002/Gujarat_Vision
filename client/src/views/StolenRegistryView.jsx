import React from 'react';
import { ShieldAlert, Plus, Siren, FileText } from 'lucide-react';

export default function StolenRegistryView() {
  const stolen = [
    { plate: "GJ01XX9999", fir: "FIR/2026/AHM/1234", car: "Hyundai Creta (White)", owner: "Rahul Sharma", date: "28 Aug 2026", ps: "Satellite Police Station" },
    { plate: "GJ05YY8888", fir: "FIR/2026/SUR/5678", car: "Kia Seltos (Black)", owner: "Pooja Varma", date: "30 Aug 2026", ps: "Varachha Police Station" },
    { plate: "GJ03ZZ7777", fir: "FIR/2026/RAJ/9012", car: "Toyota Innova (Silver)", owner: "Sanjay Patel", date: "31 Aug 2026", ps: "Bhakti Nagar PS" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Gujarat Police Stolen Vehicle Crime Registry
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active FIR records synced in real-time with eGujCop & VAHAN 4.0 database
          </p>
        </div>
        <button 
          onClick={() => alert("Open Crime Registration Portal")}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
        >
          <Plus className="w-4 h-4" /> Register New Stolen Car
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stolen.map((s, i) => (
          <div key={i} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-red-500/40 transition">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-extrabold text-red-400 font-mono tracking-wider bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                {s.plate}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                {s.fir}
              </span>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <h4 className="font-bold text-white font-sans text-sm">{s.car}</h4>
              <p className="text-slate-400">Owner: <span className="text-slate-200">{s.owner}</span></p>
              <p className="text-slate-400">Station: <span className="text-cyan-400">{s.ps}</span></p>
              <p className="text-[10px] text-slate-500 mt-2">Reported: {s.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}