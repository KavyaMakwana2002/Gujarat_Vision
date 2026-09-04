import React, { useEffect, useRef, useState } from 'react';
import { X, Shield, MapPin, Radio, Eye, Camera, Sun, Layers } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { SENTINEL_CAMERAS } from './CameraMatrixView';

export const SENTINEL_GRID_GIS = SENTINEL_CAMERAS;

// Exact GPS coordinates for each of the 30 camera locations
const CAMERA_COORDS = {
  cam01: { lat: 23.0505, lng: 72.5518, name: "Chiman bhai Bridge",        city: "Ahmedabad" },
  cam02: { lat: 23.0267, lng: 72.5714, name: "Janpath",                    city: "Ahmedabad" },
  cam03: { lat: 23.0225, lng: 72.5714, name: "O.N.G.C. Office",            city: "Ahmedabad" },
  cam04: { lat: 23.0098, lng: 72.5626, name: "Paldi Circle",               city: "Ahmedabad" },
  cam05: { lat: 23.0997, lng: 72.5512, name: "Visat teen Rasta",           city: "Ahmedabad" },
  cam06: { lat: 21.5252, lng: 70.4580, name: "Timbavadi gate-Junagadh",   city: "Junagadh"  },
  cam07: { lat: 20.9000, lng: 70.3700, name: "hero-showroom-gir-somnath", city: "Gir Somnath"},
  cam08: { lat: 21.5220, lng: 70.4558, name: "majewadi-gate-junagadh",    city: "Junagadh"  },
  cam09: { lat: 21.5350, lng: 70.4670, name: "new-bypass-junagadh-2",     city: "Junagadh"  },
  cam10: { lat: 21.5180, lng: 70.4620, name: "char-chowk-road-2-junagadh",city: "Junagadh"  },
  cam11: { lat: 21.5300, lng: 70.4590, name: "dolatpara-junagadh",        city: "Junagadh"  },
  cam12: { lat: 23.1620, lng: 72.5852, name: "Tri Mandir Adalaj Tollnaka", city: "Gandhinagar"},
  cam13: { lat: 23.0150, lng: 72.5680, name: "CN Vidhyalaya",             city: "Ahmedabad" },
  cam14: { lat: 23.0320, lng: 72.5770, name: "Delight RLVD",              city: "Ahmedabad" },
  cam15: { lat: 23.0480, lng: 72.5870, name: "Suvidha park",              city: "Ahmedabad" },
  cam16: { lat: 23.1020, lng: 72.5590, name: "Visat P2",                  city: "Ahmedabad" },
  cam17: { lat: 22.3070, lng: 70.8020, name: "Rajkot Bus Port CCTV",     city: "Rajkot"    },
  cam18: { lat: 22.3000, lng: 70.7880, name: "Rajkot CCTV",              city: "Rajkot"    },
  cam19: { lat: 20.7890, lng: 72.9250, name: "KHAPARIA Gram Panchayat – Navsari", city: "Navsari" },
  cam20: { lat: 23.0380, lng: 72.5850, name: "Mohanpura",                 city: "Ahmedabad" },
  cam21: { lat: 23.8490, lng: 72.1160, name: "Patan Dethali Char Rasta", city: "Patan"     },
  cam22: { lat: 24.1750, lng: 72.4260, name: "BK Mervada tran Rasta",    city: "Banaskantha"},
  cam23: { lat: 23.5880, lng: 72.3260, name: "kheram",                    city: "Mehsana"   },
  cam24: { lat: 23.1770, lng: 72.7570, name: "dehgam",                   city: "Gandhinagar"},
  cam25: { lat: 20.8130, lng: 72.9410, name: "dhanori",                  city: "Navsari"   },
  cam26: { lat: 20.7750, lng: 72.9520, name: "TANKAL",                   city: "Navsari"   },
  cam27: { lat: 20.7650, lng: 72.9600, name: "bilimora (cam27)",          city: "Navsari"   },
  cam28: { lat: 20.7710, lng: 72.9570, name: "bilimora (cam28)",          city: "Navsari"   },
  cam29: { lat: 20.7680, lng: 72.9545, name: "bilimora (cam29)",          city: "Navsari"   },
  cam30: { lat: 23.0690, lng: 70.1320, name: "Gandhidham Rambaugh p2",   city: "Kutch"     },
};

const TILE_STYLES = {
  light: {
    name: '☀️ Clean Light Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  positron: {
    name: '🏙️ Bright Positron',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
  },
  satellite: {
    name: '🛰️ Satellite Hybrid',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
};

export default function GisMapView({ onSelectCamera }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const [selectedCam, setSelectedCam] = useState(null);
  const [mapStyle, setMapStyle] = useState('light'); // Default to clear, bright Light Map

  useEffect(() => {
    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapInstance.current) return;

      // Initialize map centered on Gujarat with smooth zoom
      const map = L.map(mapRef.current, {
        center: [22.2587, 71.1924],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstance.current = map;

      // Add Bright, High-Contrast Light Tile Layer (NO API KEY REQUIRED)
      const currentTile = TILE_STYLES[mapStyle] || TILE_STYLES.light;
      tileLayerRef.current = L.tileLayer(currentTile.url, {
        attribution: currentTile.attribution,
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      // Custom high-contrast green checkmark / tick icon for cameras
      const createCamIcon = (camId) => L.divIcon({
        className: '',
        html: `
          <div style="
            position:relative;
            display:flex;
            flex-direction:column;
            align-items:center;
            cursor:pointer;
          ">
            <div style="
              width:32px; height:32px;
              background: linear-gradient(135deg, #059669, #10b981);
              border: 2.5px solid #ffffff;
              border-radius: 50%;
              display:flex; align-items:center; justify-content:center;
              box-shadow: 0 4px 14px rgba(0,0,0,0.35), 0 0 0 4px rgba(16,185,129,0.35);
              position:relative;
              z-index:2;
            ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style="
              width:2px; height:8px;
              background:#059669;
              margin-top:-2px;
            "></div>
            <div style="
              background:#090d16;
              border:1.5px solid #10b981;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              border-radius:6px;
              padding:2px 7px;
              font-size:10px;
              font-family:monospace;
              color:#34d399;
              white-space:nowrap;
              margin-top:1px;
              font-weight:900;
              letter-spacing:0.05em;
            ">${camId.toUpperCase()}</div>
          </div>`,
        iconSize: [64, 64],
        iconAnchor: [32, 54],
        popupAnchor: [0, -54],
      });

      // Add markers for all 30 cameras
      Object.entries(CAMERA_COORDS).forEach(([camId, coord]) => {
        const marker = L.marker([coord.lat, coord.lng], {
          icon: createCamIcon(camId),
          title: coord.name,
        });

        marker.addTo(map);

        // Highlight ring around camera locations
        L.circle([coord.lat, coord.lng], {
          radius: 2500,
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 1.5,
          opacity: 0.6,
        }).addTo(map);

        marker.on('click', () => {
          const cam = SENTINEL_CAMERAS.find((c) => c.id === camId);
          if (cam) setSelectedCam({ ...cam, ...coord });
        });

        markersRef.current[camId] = marker;
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map tiles dynamically when user switches style
  const handleStyleChange = (styleKey) => {
    setMapStyle(styleKey);
    if (!mapInstance.current || !tileLayerRef.current) return;
    import('leaflet').then((L) => {
      mapInstance.current.removeLayer(tileLayerRef.current);
      const newTile = TILE_STYLES[styleKey] || TILE_STYLES.light;
      tileLayerRef.current = L.tileLayer(newTile.url, {
        attribution: newTile.attribution,
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(mapInstance.current);
    });
  };

  const focusCamera = (camId) => {
    if (!mapInstance.current) return;
    const coord = CAMERA_COORDS[camId];
    if (!coord) return;
    mapInstance.current.flyTo([coord.lat, coord.lng], 14, { duration: 1.2 });
    const cam = SENTINEL_CAMERAS.find((c) => c.id === camId);
    if (cam) setSelectedCam({ ...cam, ...coord });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 px-5 py-3.5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" /> Gujarat Sentinel GIS Command Map
          </h2>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            Bright &amp; Clear Road Mapping • 30 Gujarat Camera Nodes (✓) • Real GPS Coordinates
          </p>
        </div>

        {/* Map Tile Style Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700">
            {Object.entries(TILE_STYLES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => handleStyleChange(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                  mapStyle === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs font-mono flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-pulse" /> 30 ONLINE
          </span>
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="flex flex-col xl:flex-row gap-4" style={{ minHeight: '620px' }}>
        {/* Map */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" style={{ minHeight: '600px' }}>
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '600px', background: '#e5e7eb' }} />

          {/* Map overlay: district legend */}
          <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 space-y-1 z-[400] shadow-xl pointer-events-none">
            <div className="text-emerald-400 font-bold mb-1">📍 Gujarat Sentinel Network (30 Cameras)</div>
            <div>🟢 Ahmedabad (9)  🟢 Junagadh (5)</div>
            <div>🟢 Navsari (5)    🟢 Gandhinagar (2)</div>
            <div>🟢 Rajkot (2)     🟢 Patan, Banaskantha, Mehsana, Gir Somnath, Kutch (7)</div>
          </div>

          {/* Sentinel HUD overlay */}
          <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-2 text-[10px] font-mono text-cyan-300 flex items-center gap-2 z-[400] shadow-xl pointer-events-none">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">GUJARAT POLICE SENTINEL • CLEAR LIGHT ROAD GIS • 30 NODES ACTIVE</span>
          </div>
        </div>

        {/* Right Sidebar: Camera List */}
        <div className="xl:w-72 flex flex-col gap-2 overflow-y-auto bg-slate-950/60 p-2 rounded-2xl border border-slate-800" style={{ maxHeight: '630px' }}>
          <div className="text-xs font-mono text-slate-300 font-bold px-1 mb-1 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-400" /> 30 LOCATIONS (CLICK TO FOCUS)
          </div>
          {SENTINEL_CAMERAS.map((cam) => {
            const coord = CAMERA_COORDS[cam.id];
            const isActive = selectedCam?.id === cam.id;
            return (
              <button
                key={cam.id}
                onClick={() => focusCamera(cam.id)}
                className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-center gap-2.5 group ${
                  isActive
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow shadow-emerald-500/20'
                    : 'bg-slate-900/80 border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-800/80'
                }`}
              >
                {/* Tick / Check */}
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${
                  isActive ? 'bg-emerald-500 border-emerald-300 text-white' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                  ✓
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-mono font-bold truncate ${isActive ? 'text-emerald-300' : 'text-slate-200 group-hover:text-emerald-300'}`}>
                    {cam.id.toUpperCase()} — {cam.city}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{cam.name}</div>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex-shrink-0 font-bold">
                  LIVE
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Stream Popup when marker clicked */}
      {selectedCam && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
                  {selectedCam.id.toUpperCase()}
                </span>
                <span className="font-bold text-white text-sm">{selectedCam.name} ({selectedCam.city})</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                  LIVE 1080p
                </span>
              </div>
              <button
                onClick={() => setSelectedCam(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Video */}
            <div className="relative aspect-video bg-black">
              <img
                src={`${API_BASE_URL}/api/video_feed?cam_id=${selectedCam.id}&city=${encodeURIComponent(selectedCam.city)}&junction=${encodeURIComponent(selectedCam.name)}`}
                alt={selectedCam.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Footer */}
            <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>RTSP: 103.250.160.189:8554/stream/{selectedCam.id}</span>
              <button
                onClick={() => {
                  if (onSelectCamera) onSelectCamera(selectedCam);
                  setSelectedCam(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow shadow-blue-600/30"
              >
                Stream to Mission Control
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
