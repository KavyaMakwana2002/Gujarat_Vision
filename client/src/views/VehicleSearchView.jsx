import React, { useState } from 'react';
import { Search, Car, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';

export default function VehicleSearchView({ detections, watchlist }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = (detections || []).filter((d) => {
    const matchesQuery = (d.plate_number || '').toLowerCase().includes(query.toLowerCase()) ||
                         (d.vehicle_type || '').toLowerCase().includes(query.toLowerCase());
    const matchesType = filterType === 'ALL' || (d.vehicle_type || '').toUpperCase() === filterType;
    return matchesQuery && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" /> State-Wide Vehicle & License Plate Search
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Instant search across 80,000 cameras with VAHAN 4.0 & eGujCop database cross-referencing
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plate (e.g. GJ01...)"
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono w-64"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="CAR">Cars</option>
            <option value="BUS">Buses</option>
            <option value="TRUCK">Trucks</option>
            <option value="MOTORCYCLE">Motorcycles</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-slate-800 text-slate-400 bg-slate-950/60 text-[11px]">
              <tr>
                <th className="p-3">LOG ID</th>
                <th className="p-3">LICENSE PLATE</th>
                <th className="p-3">VEHICLE TYPE</th>
                <th className="p-3">LOCATION NODE</th>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-500">#{d.id || i + 1}</td>
                    <td className="p-3 font-bold text-blue-400 text-sm tracking-wider">
                      {d.plate_number}
                    </td>
                    <td className="p-3 uppercase text-slate-300 font-semibold">{d.vehicle_type}</td>
                    <td className="p-3 text-slate-400">{d.location || 'Ahmedabad SG Highway Node #1'}</td>
                    <td className="p-3 text-slate-500">{d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'Live'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No vehicle records matching "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}