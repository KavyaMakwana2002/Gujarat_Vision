import React from 'react';
import { MapPin, Camera, Radio, Eye } from 'lucide-react';
import { DISTRICTS } from './CameraMatrixView';

export default function LiveLocationView({ onSelectHub }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" /> Gujarat District Surveillance Hubs (80,000 Total Feeds)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Live CCTV camera distribution across all 33 Gujarat Police Commissionerates & Ranges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DISTRICTS.slice(1).map((d, i) => (
          <div
            key={i}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-blue-500/40 transition group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-sm font-sans">{d.name}</h3>
                <p className="text-xs font-mono text-cyan-400 font-bold mt-1">
                  {d.count.toLocaleString()} Active Cameras
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                #{i + 1}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> 100% Online
              </span>
              <button
                onClick={() => onSelectHub && onSelectHub(d)}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition font-bold text-xs"
              >
                Inspect Feeds
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}