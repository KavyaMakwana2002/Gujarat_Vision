import React, { useState } from 'react';
import { Network, Grid } from 'lucide-react';
import VmsFederationHubView from './VmsFederationHubView';
import VideoWallView from './VideoWallView';

export default function VmsAndVideoWallHubView() {
  const [activeTab, setActiveTab] = useState('federation'); // 'federation' or 'videowall'

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Top Navigation Tabs for Unified Hub */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-md mx-auto shadow-xl shrink-0">
        <button
          onClick={() => setActiveTab('federation')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'federation' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Network className="w-4 h-4" /> VMS Federation Hub
        </button>
        <button
          onClick={() => setActiveTab('videowall')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'videowall' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Grid className="w-4 h-4" /> Multi-VMS Video Wall
        </button>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
        {activeTab === 'federation' ? (
          <VmsFederationHubView />
        ) : (
          <VideoWallView />
        )}
      </div>
    </div>
  );
}
