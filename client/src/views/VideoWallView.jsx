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
  Square,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import { SENTINEL_CAMERAS } from './CameraMatrixView';
import { API_BASE_URL } from '../services/api';

// Complete Camera Catalogue with Tollnakas & Regional Nodes
const TOLL_CAMERAS = [
  { id: 'cam12', name: 'CAM12: Tri Mandir Tollnaka (Gandhinagar)', city: 'Gandhinagar', type: 'NHAI Toll' },
  { id: 'toll-ne1-01', name: 'NE-1 Expressway Toll Node (CAM12)', city: 'Expressway', type: 'NHAI Toll' },
  { id: 'toll-ne1-02', name: 'NE-1 Anand Interchange Node (CAM05)', city: 'Anand', type: 'NHAI Toll' },
  { id: 'toll-nh48-03', name: 'NH-48 Kamrej Toll Plaza (CAM17)', city: 'Surat', type: 'NHAI Toll' },
  { id: 'toll-nh27-04', name: 'NH-27 Bamanbore Toll (CAM07)', city: 'Surendranagar', type: 'NHAI Toll' },
];

const PRESETS = [
  {
    name: 'Ahmedabad Metro Core',
    desc: 'Busiest city junction nodes',
    cams: ['cam01', 'cam02', 'cam03', 'cam04', 'cam05', 'cam13', 'cam14', 'cam15', 'cam16']
  },
  {
    name: 'Statewide Tollnakas & Highways',
    desc: 'High-speed ANPR corridor checkpoints',
    cams: ['cam12', 'toll-ne1-01', 'toll-ne1-02', 'toll-nh48-03', 'toll-nh27-04', 'cam07', 'cam17', 'cam21', 'cam01']
  },
  {
    name: 'Saurashtra & Coastal Grid',
    desc: 'Junagadh, Rajkot & Gir Somnath',
    cams: ['cam06', 'cam07', 'cam08', 'cam09', 'cam10', 'cam11', 'cam17', 'cam18', 'cam30']
  },
  {
    name: 'South Gujarat & Regional',
    desc: 'Navsari, Surat, Patan & Banaskantha',
    cams: ['cam19', 'cam25', 'cam26', 'cam27', 'cam28', 'cam29', 'cam21', 'cam22', 'cam24']
  }
];

export default function VideoWallView() {
  const [layout, setLayout] = useState('2x2'); // '2x2' or '3x3'
  const [fullscreenTile, setFullscreenTile] = useState(null);
  
  // Independent tile feed assignments (Default diverse 9-camera grid)
  const [tileFeeds, setTileFeeds] = useState([
    'cam01', // Tile 1
    'cam02', // Tile 2
    'cam06', // Tile 3
    'cam12', // Tile 4
    'cam05', // Tile 5
    'cam17', // Tile 6
    'cam19', // Tile 7
    'cam21', // Tile 8
    'cam07'  // Tile 9
  ]);

  const [tileRefreshKeys, setTileRefreshKeys] = useState(() => ({
    0: Date.now(), 1: Date.now(), 2: Date.now(),
    3: Date.now(), 4: Date.now(), 5: Date.now(),
    6: Date.now(), 7: Date.now(), 8: Date.now()
  }));

  const handleFeedChange = (index, newCamId) => {
    if (!newCamId) return;
    const cleanId = String(newCamId).toLowerCase().trim();
    setTileFeeds(prev => {
      const updated = [...prev];
      updated[index] = cleanId;
      return updated;
    });
    setTileRefreshKeys(prev => ({
      ...prev,
      [index]: Date.now()
    }));
  };

  const handleRefreshTile = (index) => {
    setTileRefreshKeys(prev => ({
      ...prev,
      [index]: Date.now()
    }));
  };

  const handleRefreshAll = () => {
    const now = Date.now();
    setTileRefreshKeys({
      0: now, 1: now, 2: now,
      3: now, 4: now, 5: now,
      6: now, 7: now, 8: now
    });
  };

  const applyPreset = (presetCams) => {
    setTileFeeds(presetCams);
    handleRefreshAll();
  };

  const getTileStreamUrl = (feedId, index) => {
    const t = tileRefreshKeys[index] || Date.now();
    return `${API_BASE_URL}/api/video_feed?cam_id=${feedId}&t=${t}`;
  };

  const getCameraDetails = (feedId) => {
    const toll = TOLL_CAMERAS.find(t => t.id.toLowerCase() === feedId.toLowerCase());
    if (toll) return toll;
    const sentinel = SENTINEL_CAMERAS.find(c => c.id.toLowerCase() === feedId.toLowerCase());
    if (sentinel) {
      return {
        id: sentinel.id,
        name: `${sentinel.id.toUpperCase()}: ${sentinel.name}`,
        city: sentinel.city,
        type: 'Police Grid'
      };
    }
    return {
      id: feedId,
      name: `Node ${feedId.toUpperCase()}`,
      city: 'Gujarat',
      type: 'Live Stream'
    };
  };

  const numTiles = layout === '2x2' ? 4 : 9;

  return (
    <div className="space-y-4 pb-10">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Grid className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Multi-VMS Surveillance Video Wall
              <span className="text-[11px] font-mono font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ISOLATED MULTI-STREAM
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Each video wall cell streams independently with individual camera selection
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-semibold transition shadow"
            title="Reload All Video Streams"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Feeds</span>
          </button>
        </div>
      </div>

      {/* Regional Quick Preset Bar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-300">Quick Grid Presets:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset, pIdx) => (
            <button
              key={pIdx}
              onClick={() => applyPreset(preset.cams)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-lg text-[11px] font-mono text-slate-200 transition flex items-center gap-1.5"
              title={preset.desc}
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Video Wall Grid Display */}
      <div className={`grid gap-3.5 ${
        layout === '2x2' 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {tileFeeds.slice(0, numTiles).map((feedId, idx) => {
          const camDetails = getCameraDetails(feedId);

          return (
            <div 
              key={idx}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col group hover:border-blue-500/50 transition"
            >
              {/* Tile Header */}
              <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 bg-blue-500/20 text-blue-400">
                    #{idx + 1}
                  </span>

                  {/* Independent Feed Selector Dropdown for THIS Tile */}
                  <select
                    value={feedId}
                    onChange={(e) => handleFeedChange(idx, e.target.value)}
                    className="bg-slate-900 border border-slate-800 hover:border-blue-500 text-white font-bold text-xs rounded-lg px-2 py-1 outline-none cursor-pointer truncate max-w-[260px] transition"
                  >
                    <optgroup label="⚡ Highway Tolls & Expressways">
                      {TOLL_CAMERAS.map((toll) => (
                        <option key={toll.id} value={toll.id} className="bg-slate-950 text-white">
                          {toll.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="🏙️ Ahmedabad Urban Grid">
                      {SENTINEL_CAMERAS.filter(c => c.city === 'Ahmedabad').map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                          {c.id.toUpperCase()}: {c.name} ({c.city})
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="🌊 Saurashtra (Junagadh & Rajkot)">
                      {SENTINEL_CAMERAS.filter(c => ['Junagadh', 'Rajkot', 'Gir Somnath'].includes(c.city)).map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                          {c.id.toUpperCase()}: {c.name} ({c.city})
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="🌴 South Gujarat (Navsari, Surat)">
                      {SENTINEL_CAMERAS.filter(c => ['Navsari', 'Surat'].includes(c.city)).map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                          {c.id.toUpperCase()}: {c.name} ({c.city})
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="📍 Other District Nodes">
                      {SENTINEL_CAMERAS.filter(c => !['Ahmedabad', 'Junagadh', 'Rajkot', 'Gir Somnath', 'Navsari', 'Surat'].includes(c.city)).map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                          {c.id.toUpperCase()}: {c.name} ({c.city})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRefreshTile(idx)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                    title="Reload Tile Stream"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setFullscreenTile(feedId)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                    title="Maximize Tile"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Video Player Screen */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                <img
                  key={`${feedId}-${tileRefreshKeys[idx] || 0}`}
                  src={getTileStreamUrl(feedId, idx)}
                  alt={`Tile ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';
                  }}
                />

                {/* Tactical HUD Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold text-white">{camDetails.city}</span>
                    <span className="text-slate-400 text-[9px] font-bold uppercase">({camDetails.type})</span>
                  </div>
                  <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-emerald-400 font-bold">
                    ● {feedId.toUpperCase()} • 30 FPS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Expansion Modal */}
      {fullscreenTile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-white uppercase">
                  Tactical Focus: {fullscreenTile.toUpperCase()}
                </span>
                <span className="text-slate-400">
                  {getCameraDetails(fullscreenTile).name}
                </span>
              </div>
              <button
                onClick={() => setFullscreenTile(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src={`${API_BASE_URL}/api/video_feed?cam_id=${fullscreenTile}&t=${Date.now()}`}
                alt="Fullscreen Stream"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}