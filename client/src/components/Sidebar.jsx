import React from 'react';
import {
  LayoutDashboard,
  Camera,
  MapPin,
  Map,
  Car,
  Search,
  Disc,
  AlertTriangle,
  ShieldAlert,
  Crosshair,
  Network,
  LogOut,
  Siren,
  Building2,
  Grid,
  Laptop,
  Smartphone
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: '1. Mission Control', icon: LayoutDashboard, sub: 'Live Feed & Metrics' },
  { id: 'vms-federation', label: '2. VMS Hub & Video Wall', icon: Network, sub: 'Federation & Live Matrix' },
  { id: 'camera-matrix', label: '3. Camera Grid & Live Locations', icon: Camera, sub: '30 Nodes & City Junctions' },
  { id: 'registry', label: '4. CCTV Registry & GIS Map', icon: Building2, sub: 'Database & Live Mapping' },
  { id: 'vehicle-intel-hub', label: '5. Vehicle & Intelligence Hub', icon: ShieldAlert, sub: 'RTO Registry & Crime Tracking', badgeColor: 'text-purple-400' },
  { id: 'record-video', label: '6. Record & Evidence', icon: Disc, sub: 'Incident Clips' },
  { id: 'stray-animal', label: '7. Stray Animal Detection', icon: AlertTriangle, sub: 'Highway Hazard System' },
  { id: 'green-corridor', label: '8. Green Corridor', icon: Crosshair, sub: 'Ambulance Life-Saver' },
  { id: 'sos-safety', label: '9. Women Safety SOS', icon: Siren, sub: 'Gesture Panic Dispatch', badgeColor: 'text-pink-400' },
  { id: 'laptop-cam', label: '10. Mobile & Web Cam ANPR', icon: Smartphone, sub: 'Phone Back Cam Scanner' },
  { id: 'speed-challan', label: '11. Speed Radar & E-Challan', icon: Camera, sub: 'Over-speeding Detection' },
];

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  return (
    <aside className="w-72 premium-glass flex flex-col justify-between shrink-0 h-[calc(100vh-6.5rem)] ml-6 mb-6 rounded-2xl shadow-xl shadow-black/50 overflow-hidden relative border border-slate-700/50">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
      <div className="p-4 space-y-2 overflow-y-auto z-10 custom-scrollbar">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-2">
          Operations
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left text-xs font-semibold group ${isActive
                ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/60 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white/20 shadow-inner' : 'bg-slate-900/50 group-hover:bg-slate-700/50'}`}>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.badgeColor || 'text-slate-400 group-hover:text-white transition-colors'}`} />
              </div>
              <div className="leading-tight overflow-hidden truncate">
                <p className="truncate tracking-wide text-[13px]">{item.label}</p>
                <p className={`text-[10px] font-mono mt-0.5 truncate ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                  {item.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-md z-10">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] rounded-xl transition-all duration-300 text-[13px] font-bold tracking-widest"
        >
          <LogOut className="w-4 h-4" /> DISCONNECT
        </button>
      </div>
    </aside>
  );
}