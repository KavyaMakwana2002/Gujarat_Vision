import React, { useState } from 'react';
import VehicleRegistryView from './VehicleRegistryView';
import CrimeTrackingHubView from './CrimeTrackingHubView';
import { Car, ShieldAlert } from 'lucide-react';

export default function VehicleIntelligenceHubView({ detections = [], liveAlerts = [] }) {
  const [activeTab, setActiveTab] = useState('vehicle'); // 'vehicle' or 'crime'

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Modern Tab Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded-xl border border-slate-700/50 shadow-inner w-fit">
        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold font-mono transition-all duration-300 ${
            activeTab === 'vehicle'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          Vehicle Master & RTO Registry
        </button>
        
        <button
          onClick={() => setActiveTab('crime')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold font-mono transition-all duration-300 ${
            activeTab === 'crime'
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Crime & Intelligence Hub
        </button>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
        {activeTab === 'vehicle' ? (
          <VehicleRegistryView detections={detections} />
        ) : (
          <CrimeTrackingHubView alerts={liveAlerts} />
        )}
      </div>
    </div>
  );
}
