import React, { useState } from 'react';
import { Camera, Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export const DISTRICTS = [
  { name: 'All Gujarat Matrix', count: 80000 },
  { name: 'Ahmedabad Police Command', count: 12500 },
  { name: 'Surat City & Industrial', count: 11000 },
  { name: 'Vadodara Urban Node', count: 7500 },
  { name: 'Rajkot Saurashtra Grid', count: 6800 },
  { name: 'Kutch Border & Port Area', count: 6200 },
  { name: 'Dwarka Coastal Post', count: 4800 },
  { name: 'Bhavnagar Highway Grid', count: 4500 },
  { name: 'Gandhinagar Capital Post', count: 5200 },
  { name: 'Mehsana State Highway', count: 4200 },
];

export default function CameraMatrixView({ onSelectCamera }) {
  const [selectedDistrict, setSelectedDistrict] = useState('All Gujarat Matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Generate virtual camera items for the current page
  const totalInScope = DISTRICTS.find(d => d.name === selectedDistrict)?.count || 80000;
  const totalPages = Math.ceil(totalInScope / perPage);

  const cameras = Array.from({ length: perPage }, (_, i) => {
    const camId = (page - 1) * perPage + i + 1;
    return {
      id: camId,
      code: `GJ-CAM-${String(camId).padStart(5, '0')}`,
      location: `${selectedDistrict} - Junction Node #${camId}`,
      status: camId % 9 === 0 ? 'AI SYNCING' : 'ONLINE',
      fps: 30,
      res: '1080p'
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" /> 80,000 Live Surveillance Camera Matrix
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active state-wide CCTV network across 33 districts of Gujarat
          </p>
        </div>

        {/* Search & District Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search camera number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono w-56"
            />
          </div>

          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
          >
            {DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.count.toLocaleString()} Feeds)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cameras.map((cam) => (
          <div
            key={cam.id}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 hover:border-blue-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-white group-hover:text-blue-400 transition">
                  {cam.code}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {cam.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{cam.location}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">{cam.res} • {cam.fps} FPS</span>
              <button
                onClick={() => onSelectCamera && onSelectCamera(cam)}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs font-mono text-slate-400">
        <span>Showing Page {page} of {totalPages.toLocaleString()} ({totalInScope.toLocaleString()} Feeds)</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
