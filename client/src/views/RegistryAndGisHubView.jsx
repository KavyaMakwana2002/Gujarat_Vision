import React, { useState } from 'react';
import { Building2, Map } from 'lucide-react';
import CctvRegistryView from './CctvRegistryView';
import GisMapView from './GisMapView';

export default function RegistryAndGisHubView({ onSelectCamera }) {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' or 'gis'

  return (
    <div className="flex flex-col h-full w-full gap-4 overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="flex shrink-0 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-md mx-auto shadow-xl">
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'registry' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> CCTV Master Registry
        </button>
        <button
          onClick={() => setActiveTab('gis')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'gis' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Map className="w-4 h-4" /> Live GIS Command Map
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-1 ${activeTab === 'gis' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar pb-6'}`}>
        {activeTab === 'registry' ? (
          <CctvRegistryView onSelectCamera={onSelectCamera} />
        ) : (
          <GisMapView onSelectCamera={onSelectCamera} />
        )}
      </div>
    </div>
  );
}
