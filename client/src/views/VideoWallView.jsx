import React, { useState } from 'react';
import { 
  Grid, 
  Layers, 
  Maximize2, 
  LayoutGrid,
  RefreshCw, 
  Radio, 
  Shield, 
  Camera, 
  CheckCircle2,
  Sliders,
  Play,
  Square
} from 'lucide-react';
import { SENTINEL_CAMERAS } from './CameraMatrixView';
import { API_BASE_URL } from '../services/api';

export default function VideoWallView() {
  const [layout, setLayout] = useState('2x2'); // '2x2' or '3x3'
  
  // Available Camera Sources (Sentinel Grid)
  const availableSources = [
    { id: 'cam01', name: 'CAM01: Chiman bhai Bridge (Ahmedabad)', type: 'Sentinel Grid' },
    { id: 'cam02', name: 'CAM02: Janpath (Ahmedabad)', type: 'Sentinel Grid' },
    { id: 'cam03', name: 'CAM03: O.N.G.C. Office (Ahmedabad)', type: 'Sentinel Grid' },
    { id: 'cam04', name: 'CAM04: Paldi Circle (Ahmedabad)', type: 'Sentinel Grid' },
    { id: 'cam05', name: 'CAM05: Visat teen Rasta (Ahmedabad)', type: 'Sentinel Grid' },
    { id: 'cam06', name: 'CAM06: Timbavadi gate (Junagadh)', type: 'Sentinel Grid' },
    { id: 'cam07', name: 'CAM07: hero-showroom (Gir Somnath)', type: 'Sentinel Grid' },
    { id: 'cam12', name: 'CAM12: Tri Mandir Tollnaka (Gandhinagar)', type: 'Sentinel Grid' },
    { id: 'cam17', name: 'CAM17: Rajkot Bus Port CCTV (Rajkot)', type: 'Sentinel Grid' },
    { id: 'cam19', name: 'CAM19: Khaparia Panchayat (Navsari)', type: 'Sentinel Grid' },
    { id: 'cam21', name: 'CAM21: Surat Ring Road Node (Surat)', type: 'Sentinel Grid' },
    { id: 'cam22', name: 'CAM22: Vadodara Sayajigunj Tower', type: 'Sentinel Grid' }
  ];

  // Tile assignments
  const [tileFeeds, setTileFeeds] = useState([
    'cam01',
    'cam02',
    'cam06',
    'cam03',
    'cam04',
    'cam05',
    'cam12',
    'cam17',
    'cam21'
  ]);

  const [refreshKeys, setRefreshKeys] = useState(Date.now());

  const handleFeedChange = (index, newCamId) => {
    const updated = [...tileFeeds];
    updated[index] = newCamId;
    setTileFeeds(updated);
  };

  const handleRefreshAll = () => {
    setRefreshKeys(Date.now());
  };

  const getTileStreamUrl = (feedId) => {
    return `${API_BASE_URL}/api/video_feed?cam_id=${feedId}&t=${refreshKeys}`;
  };

  const numTiles = layout === '2x2' ? 4 : 9;

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Grid className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Multi-VMS Surveillance Video Wall
              <span className="text-[11px] font-mono font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Simultaneous multi-camera grid aggregating live feeds from Sentinel Government Grid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Layout Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLayout('2x2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                layout === '2x2' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              2x2 Grid (4 Cams)
            </button>
            <button
              onClick={() => setLayout('3x3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                layout === '3x3' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              3x3 Wall (9 Cams)
            </button>
          </div>

          <button
            onClick={handleRefreshAll}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center gap-1 transition"
            title="Reload Video Streams"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Wall Grid Display */}
      <div className={`grid gap-3.5 ${
        layout === '2x2' 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {tileFeeds.slice(0, numTiles).map((feedId, idx) => {
          const currentSource = availableSources.find(s => s.id === feedId) || availableSources[0];

          return (
            <div 
              key={idx}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col group hover:border-blue-500/50 transition"
            >
              {/* Tile Header */}
              <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 bg-blue-500/20 text-blue-400">
                    #{idx + 1}
                  </span>

                  {/* Feed Selector Dropdown */}
                  <select
                    value={feedId}
                    onChange={(e) => handleFeedChange(idx, e.target.value)}
                    className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer truncate max-w-[240px]"
                  >
                    {availableSources.map((source) => (
                      <option key={source.id} value={source.id} className="bg-slate-900 text-white">
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-[9px] px-2 py-0.5 rounded font-bold border shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {currentSource.type || 'ONLINE'}
                </span>
              </div>

              {/* Video Player Screen */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={getTileStreamUrl(feedId)}
                  alt={`Tile ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';
                  }}
                />

                {/* Tactical HUD Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>{currentSource.type}</span>
                  </div>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-emerald-400">
                    ● 30 FPS • 1080p
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}