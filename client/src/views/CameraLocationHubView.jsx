import React, { useState } from 'react';
import { Camera, MapPin } from 'lucide-react';
import CameraMatrixView from './CameraMatrixView';
import LiveLocationView from './LiveLocationView';

export default function CameraLocationHubView({ onSelectCamera }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'location'

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Top Navigation Tabs for Unified Hub */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-md mx-auto shadow-xl shrink-0">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'camera' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" /> Sentinel Camera Grid
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'location' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" /> Live Location Hubs
        </button>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'camera' ? (
          <CameraMatrixView onSelectCamera={onSelectCamera} />
        ) : (
          <LiveLocationView onSelectHub={() => setActiveTab('camera')} />
        )}
      </div>
    </div>
  );
}
