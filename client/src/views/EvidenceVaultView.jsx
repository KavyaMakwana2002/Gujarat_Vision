import React from 'react';
import { Disc, Play, Download, Trash2, Calendar } from 'lucide-react';

export default function EvidenceVaultView() {
  const clips = [
    { id: "EVD-2026-001", title: "SG Highway Red Alert Intercept", time: "2026-09-01 10:45:12", size: "42.5 MB", duration: "02:15 min", target: "GJ01AB1234" },
    { id: "EVD-2026-002", title: "Surat Ring Road Hit-and-Run Scan", time: "2026-09-01 09:12:00", size: "65.1 MB", duration: "03:40 min", target: "GJ05CD5678" },
    { id: "EVD-2026-003", title: "Dwarka Checkpost Speed Violation", time: "2026-08-31 22:30:15", size: "28.0 MB", duration: "01:20 min", target: "GJ03EF9012" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-blue-400" /> Recorded CCTV Evidence Vault & Incident Clips
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Tamper-proof digital video evidence encrypted with SHA-256 integrity hashes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((c, i) => (
          <div key={i} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 text-xs font-mono">
                <span className="text-blue-400 font-bold">{c.id}</span>
                <span className="text-slate-500">{c.size}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1 font-sans">{c.title}</h3>
              <p className="text-xs font-mono text-red-400">Target Plate: {c.target}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">{c.time}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button 
                onClick={() => alert(`Playing Evidence Clip ${c.id}`)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Play className="w-3 h-3" /> Play Video
              </button>
              <button 
                onClick={() => alert(`Exporting tamper-proof MP4 clip with SHA-256 police certificate`)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" 
                title="Download clip"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
