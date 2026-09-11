import React, { useState } from 'react';
import { ShieldAlert, Crosshair, AlertTriangle, Car } from 'lucide-react';
import AllAlertsView from './AllAlertsView';
import StolenRegistryView from './StolenRegistryView';
import BlacklistTrackerView from './BlacklistTrackerView';

export default function CrimeTrackingHubView({ alerts }) {
  const [activeTab, setActiveTab] = useState('alerts');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Tabs for Unified Hub */}
      <div className="flex flex-wrap bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-3xl mx-auto shadow-xl">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'alerts' 
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> All Hotlist Alerts
        </button>
        <button
          onClick={() => setActiveTab('stolen')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'stolen' 
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" /> Stolen Vehicles Registry
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'blacklist' 
              ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Crosshair className="w-4 h-4" /> Blacklist GPS Tracker
        </button>
      </div>

      {/* Dynamic Content Area */}
      <div className="mt-4">
        {activeTab === 'alerts' && <AllAlertsView alerts={alerts} />}
        {activeTab === 'stolen' && <StolenRegistryView />}
        {activeTab === 'blacklist' && <BlacklistTrackerView />}
      </div>
    </div>
  );
}
