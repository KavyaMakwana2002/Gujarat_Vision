import React, { useState } from 'react';
import { AlertTriangle, Siren, MapPin, Radio, ShieldAlert, Zap } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function AllAlertsView({ alerts = [], onTriggerDispatch }) {
  const [simLoading, setSimLoading] = useState(false);

  const simulateSOS = async () => {
    setSimLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/sos/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: "CAM-0045 (BRTS Corridor)",
          location: "Ahmedabad Navrangpura BRTS Stand"
        })
      });
      alert("🚨 Women Safety SOS Alert Dispatched Successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to trigger SOS.");
    }
    setSimLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Emergency Simulator Panel (For Hackathon Demo) ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/20 border border-pink-500/30 rounded-xl">
            <Zap className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Emergency Control Simulator</h3>
            <p className="text-[10px] text-slate-400 font-mono">Trigger events manually for jury presentation</p>
          </div>
        </div>
        
        <button 
          onClick={simulateSOS}
          disabled={simLoading}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-600/20 disabled:opacity-50"
        >
          <Siren className="w-4 h-4" /> 
          {simLoading ? "Triggering..." : "Simulate SOS Panic (Women Safety)"}
        </button>
      </div>

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
                alerts.map((a, i) => {
                  let theme = { bg: "bg-red-500/5", text: "text-red-400", badgeBg: "bg-red-500/20", border: "border-red-500/30", btn: "bg-red-600 hover:bg-red-500 shadow-red-600/30" };
                  if (a.alert_type === "CRITICAL_SOS") {
                    theme = { bg: "bg-pink-500/5", text: "text-pink-400", badgeBg: "bg-pink-500/20", border: "border-pink-500/30", btn: "bg-pink-600 hover:bg-pink-500 shadow-pink-600/30" };
                  } else if (a.alert_type === "GREEN_CORRIDOR") {
                    theme = { bg: "bg-emerald-500/5", text: "text-emerald-400", badgeBg: "bg-emerald-500/20", border: "border-emerald-500/30", btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" };
                  } else if (a.alert_type === "CIVIC_HAZARD") {
                    theme = { bg: "bg-orange-500/5", text: "text-orange-400", badgeBg: "bg-orange-500/20", border: "border-orange-500/30", btn: "bg-orange-600 hover:bg-orange-500 shadow-orange-600/30" };
                  }

                  return (
                  <tr key={i} className={`hover:${theme.bg} transition`}>
                    <td className={`p-3 font-bold ${theme.text}`}>{a.id || `ALT-2026-${i+1}`}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-lg ${theme.badgeBg} ${theme.text} border ${theme.border} font-extrabold tracking-wider text-xs`}>
                        {a.plate}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-200">{a.alert_type || 'Vehicle Theft / Robbery'}</td>
                    <td className="p-3 text-slate-400">{a.location || 'Ahmedabad SG Highway (CAM-0012)'}</td>
                    <td className="p-3 text-cyan-400 font-bold">{a.database_source || 'VAHAN 4.0 & eGujCop'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded ${theme.badgeBg} ${theme.text} border ${theme.border} text-[10px] font-bold`}>
                        {a.severity || 'CRITICAL_RED'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => alert(`🚨 Dispatching Action: ${a.action_required || 'Intercept'} for ${a.plate} at ${a.location}!`)}
                        className={`px-3 py-1.5 ${theme.btn} text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-md`}
                      >
                        <Radio className="w-3.5 h-3.5" /> Action
                      </button>
                    </td>
                  </tr>
                )})
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