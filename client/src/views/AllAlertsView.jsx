import React from 'react';
import { AlertTriangle, Siren, MapPin, Radio, ShieldAlert } from 'lucide-react';

export default function AllAlertsView({ alerts = [], onTriggerDispatch }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Active Government Hotlist & Stolen Car Alerts
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time security alerts triggered by VAHAN 4.0, eGujCop & NAFIS database matches
          </p>
        </div>
        <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
          <Siren className="w-4 h-4 animate-bounce" /> {alerts.length} RED ALERTS ACTIVE
        </span>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl border border-red-500/30 bg-slate-900/80 p-4 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-slate-800 text-slate-400 bg-slate-950/80 text-[11px]">
              <tr>
                <th className="p-3">ALERT ID</th>
                <th className="p-3">TARGET PLATE</th>
                <th className="p-3">CRIME CATEGORY</th>
                <th className="p-3">LOCATION NODE</th>
                <th className="p-3">DATABASE SOURCE</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">POLICE ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.length > 0 ? (
                alerts.map((a, i) => (
                  <tr key={i} className="hover:bg-red-500/5 transition">
                    <td className="p-3 font-bold text-red-400">{a.id || `ALT-2026-${i+1}`}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold tracking-wider text-xs">
                        {a.plate}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-200">{a.alert_type || 'Vehicle Theft / Robbery'}</td>
                    <td className="p-3 text-slate-400">{a.location || 'Ahmedabad SG Highway (CAM-0012)'}</td>
                    <td className="p-3 text-cyan-400 font-bold">{a.database_source || 'VAHAN 4.0 & eGujCop'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                        CRITICAL_RED
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => alert(`🚨 Dispatching Highway Patrol Van to Intercept ${a.plate} at ${a.location}!`)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-md shadow-red-600/30"
                      >
                        <Radio className="w-3.5 h-3.5" /> Intercept
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No active red alerts at this moment.
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