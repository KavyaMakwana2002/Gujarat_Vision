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
  Building2,
  Grid,
  Laptop,
  Smartphone
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: '1. Mission Control', icon: LayoutDashboard, sub: 'Live Feed & Metrics' },
  { id: 'registry', label: '2. Centralised CCTV Registry', icon: Building2, sub: 'Bulk Import & Gap Analysis', highlight: true },
  { id: 'vms-federation', label: '3. VMS Federation Hub', icon: Network, sub: 'Model 3 Interoperability', highlight: true },
  { id: 'video-wall', label: '4. Multi-VMS Video Wall', icon: Grid, sub: '2x2 & 3x3 Live Matrix', highlight: true },
  { id: 'camera-matrix', label: '5. Sentinel Camera Grid', icon: Camera, sub: '30 Operational Nodes' },
  { id: 'gis-map', label: '6. Real GIS Command Map', icon: Map, sub: 'GPS Operational Pins' },
  { id: 'live-location', label: '7. Live Location Hubs', icon: MapPin, sub: 'City Junctions' },
  { id: 'vehicle-details', label: '8. Vehicle Details', icon: Car, sub: 'Specs & Registrations' },
  { id: 'vehicle-search', label: '9. Vehicle Search', icon: Search, sub: 'ANPR Quick Lookup' },
  { id: 'record-video', label: '10. Record & Evidence', icon: Disc, sub: 'Incident Clips' },
  { id: 'all-alerts', label: '11. All Hotlist Alerts', icon: AlertTriangle, sub: 'eGujCop Red Alerts', badgeColor: 'text-red-400' },
  { id: 'stolen-cars', label: '12. Stolen Cars Register', icon: ShieldAlert, sub: 'VAHAN 4.0 Synced' },
  { id: 'blacklist-loc', label: '13. Blacklist GPS Tracker', icon: Crosshair, sub: 'Active Targets' },
  { id: 'laptop-cam', label: '14. Mobile & Web Cam ANPR', icon: Smartphone, sub: 'Phone Back Cam Scanner', highlight: true },
];

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-[#030712]/95 backdrop-blur-md flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Navigation Control
        </div>
        
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left text-xs font-semibold ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : item.highlight
                  ? 'bg-cyan-950/20 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.badgeColor || 'text-slate-400'}`} />
              <div className="leading-tight overflow-hidden truncate">
                <p className="truncate">{item.label}</p>
                <p className={`text-[10px] font-normal truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Logout button */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout Officer
        </button>
      </div>
    </aside>
  );
}