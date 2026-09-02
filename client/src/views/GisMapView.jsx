import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Map as MapIcon, 
  Shield, 
  Radio, 
  MapPin, 
  Layers, 
  Navigation, 
  Video, 
  AlertTriangle, 
  CheckCircle2, 
  Key,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';

export const GUJARAT_POSTS = [
  { 
    id: 1, 
    name: "Ahmedabad Command Centre & SG Highway Post", 
    lat: 23.0225, 
    lng: 72.5714, 
    feeds: 12500, 
    city: "Ahmedabad", 
    status: "Optimal", 
    alertLevel: "Normal",
    officer: "DCP Traffic Grid-1",
    activeIncidents: 2
  },
  { 
    id: 2, 
    name: "Surat Ring Road & Dumas Checkpost", 
    lat: 21.1702, 
    lng: 72.8311, 
    feeds: 11000, 
    city: "Surat", 
    status: "Optimal", 
    alertLevel: "Normal",
    officer: "Joint CP Surveillance",
    activeIncidents: 0
  },
  { 
    id: 3, 
    name: "Dwarka Temple & Coastal Surveillance Node", 
    lat: 22.2442, 
    lng: 68.9685, 
    feeds: 4800, 
    city: "Devbhumi Dwarka", 
    status: "Coastal Watch", 
    alertLevel: "Warning",
    officer: "SP Coastal Patrol",
    activeIncidents: 1
  },
  { 
    id: 4, 
    name: "Mehsana Highway & Modhera Circle Node", 
    lat: 23.5880, 
    lng: 72.3693, 
    feeds: 4200, 
    city: "Mehsana", 
    status: "Optimal", 
    alertLevel: "Normal",
    officer: "DSP Highway Patrol",
    activeIncidents: 0
  },
  { 
    id: 5, 
    name: "Vadodara Urban Command Grid", 
    lat: 22.3072, 
    lng: 73.1812, 
    feeds: 7500, 
    city: "Vadodara", 
    status: "Optimal", 
    alertLevel: "Normal",
    officer: "ACP Traffic South",
    activeIncidents: 1
  },
  { 
    id: 6, 
    name: "Rajkot Saurashtra Junction Node", 
    lat: 22.3039, 
    lng: 70.8022, 
    feeds: 6800, 
    city: "Rajkot", 
    status: "Optimal", 
    alertLevel: "Normal",
    officer: "DCP Crime Branch",
    activeIncidents: 0
  },
  { 
    id: 7, 
    name: "Bhuj & Kutch Border Surveillance Hub", 
    lat: 23.2420, 
    lng: 69.6669, 
    feeds: 6200, 
    city: "Kutch", 
    status: "Border Alert", 
    alertLevel: "Critical",
    officer: "IG Border Range",
    activeIncidents: 3
  },
  { 
    id: 8, 
    name: "Gandhinagar Capital Security Grid", 
    lat: 23.2156, 
    lng: 72.6369, 
    feeds: 5200, 
    city: "Gandhinagar", 
    status: "High Security", 
    alertLevel: "Optimal",
    officer: "Secretariat Special Command",
    activeIncidents: 0
  },
];

export default function GisMapView() {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);

  const [selectedHub, setSelectedHub] = useState(null);
  // Default to Light Mode as requested
  const [mapProvider, setMapProvider] = useState(() => localStorage.getItem('gis_provider') || 'carto-light');
  const [gisApiKey, setGisApiKey] = useState(() => 
    localStorage.getItem('gis_api_key') || import.meta.env.VITE_GIS_API_KEY || ''
  );
  const [showKey, setShowKey] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Handle saving API key
  const handleApiKeyChange = (e) => {
    const val = e.target.value.trim();
    setGisApiKey(val);
    localStorage.setItem('gis_api_key', val);
  };

  const handleProviderChange = (e) => {
    const val = e.target.value;
    setMapProvider(val);
    localStorage.setItem('gis_provider', val);
  };

  const getTileConfig = (provider, key) => {
    switch (provider) {
      case 'mapbox-light':
        return {
          url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${key}`,
          attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OpenStreetMap'
        };
      case 'geoapify-light':
        return {
          url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${key}`,
          attribution: '&copy; <a href="https://www.geoapify.com/">Geoapify</a> &copy; OpenStreetMap'
        };
      case 'osm-light':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors &copy; Gujarat Cyber Vision GIS'
        };
      case 'carto-dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; Gujarat Cyber Vision GIS'
        };
      case 'carto-light':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors &copy; Gujarat Cyber Vision GIS'
        };
    }
  };

  useEffect(() => {
    if (!mapElementRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Map centered on Gujarat
    const map = L.map(mapElementRef.current, {
      center: [22.75, 71.4],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Apply Tile Layer
    const tileConfig = getTileConfig(mapProvider, gisApiKey);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Custom Glowing Radar Marker Icons
    const createCustomIcon = (hub) => {
      const isCritical = hub.alertLevel === 'Critical';
      const isWarning = hub.alertLevel === 'Warning';
      const ringColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#2563eb';
      const pulseBg = isCritical ? 'rgba(220, 38, 38, 0.35)' : isWarning ? 'rgba(217, 119, 6, 0.35)' : 'rgba(37, 99, 235, 0.35)';

      return L.divIcon({
        className: 'custom-gis-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${pulseBg}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${ringColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${ringColor};"></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });
    };

    // Render Markers
    markersRef.current = [];
    GUJARAT_POSTS.forEach((hub) => {
      const marker = L.marker([hub.lat, hub.lng], {
        icon: createCustomIcon(hub),
      }).addTo(map);

      // Clean, high-contrast popup for Light Mode
      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: #0f172a; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; min-width: 220px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="color: #2563eb; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">POLICE GIS NODE #${hub.id}</span>
            <span style="color: ${hub.alertLevel === 'Critical' ? '#dc2626' : hub.alertLevel === 'Warning' ? '#d97706' : '#16a34a'}; font-weight: 700; font-size: 9px; padding: 2px 6px; background: ${hub.alertLevel === 'Critical' ? '#fef2f2' : hub.alertLevel === 'Warning' ? '#fffbeb' : '#f0fdf4'}; border-radius: 4px; border: 1px solid currentColor;">${hub.status}</span>
          </div>
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 4px; line-height: 1.3;">${hub.name}</div>
          <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">District: <b>${hub.city}</b> • ${hub.officer}</div>
          <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
            <div>
              <div style="color: #64748b; font-size: 9px; font-weight: 600;">ACTIVE CCTVS</div>
              <div style="color: #2563eb; font-weight: 700; font-size: 13px;">${hub.feeds.toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <div style="color: #64748b; font-size: 9px; font-weight: 600;">INCIDENTS</div>
              <div style="color: ${hub.activeIncidents > 0 ? '#dc2626' : '#16a34a'}; font-weight: 700; font-size: 13px;">${hub.activeIncidents}</div>
            </div>
          </div>
          <div style="color: #94a3b8; font-size: 9px; text-align: center; font-family: monospace;">GPS: ${hub.lat.toFixed(4)}° N, ${hub.lng.toFixed(4)}° E</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
      });

      marker.on('click', () => {
        setSelectedHub(hub);
      });

      markersRef.current.push({ hub, marker });
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapProvider, gisApiKey]);

  // Quick zoom to hub
  const handleHubSelect = (hub) => {
    setSelectedHub(hub);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 12, {
        animate: true,
        duration: 1.2,
      });
      const item = markersRef.current.find((m) => m.hub.id === hub.id);
      if (item && item.marker) {
        item.marker.openPopup();
      }
    }
  };

  const handleResetView = () => {
    setSelectedHub(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.75, 71.4], 7, {
        animate: true,
        duration: 1,
      });
      mapInstanceRef.current.closePopup();
    }
  };

  const filteredPosts = GUJARAT_POSTS.filter((post) => {
    if (activeFilter === 'critical') return post.alertLevel === 'Critical';
    if (activeFilter === 'warning') return post.alertLevel === 'Warning';
    if (activeFilter === 'optimal') return post.alertLevel === 'Normal' || post.alertLevel === 'Optimal';
    return true;
  });

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Top Header Bar with GIS API Key & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-400" /> Gujarat State GIS Traffic & Crime Surveillance Map
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            High-Precision Light Mode GIS Matrix linking 80,000 CCTV nodes across Gujarat
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* GIS API Key Input */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="GIS API Key (Optional)"
              value={gisApiKey}
              onChange={handleApiKeyChange}
              className="bg-transparent text-xs text-slate-200 outline-none w-36 sm:w-44 font-mono placeholder:text-slate-500"
              title="Enter your Mapbox / Geoapify API key (Saved to local storage)"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-slate-400 hover:text-white p-0.5 transition"
              title={showKey ? "Hide API Key" : "Show API Key"}
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Map Provider Selector */}
          <select
            value={mapProvider}
            onChange={handleProviderChange}
            className="bg-slate-950 text-xs text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 outline-none font-mono cursor-pointer hover:border-slate-600 transition"
          >
            <option value="carto-light">☀️ Light Mode (Carto Positron)</option>
            <option value="osm-light">☀️ Light Mode (OpenStreetMap Standard)</option>
            <option value="geoapify-light">☀️ Light Mode (Geoapify + Key)</option>
            <option value="mapbox-light">☀️ Light Mode (Mapbox + Key)</option>
            <option value="carto-dark">🌙 Dark Mode (Tactical HUD)</option>
          </select>

          {/* Center Gujarat Extent */}
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-mono transition"
            title="Reset to Gujarat Full Extent"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Center State</span>
          </button>

          <span className="text-xs font-mono px-3 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            8 POLICE HQ HUBS ACTIVE
          </span>
        </div>
      </div>

      {/* Main Content: Hubs Selector + Map Canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left Side: Police Hubs List */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" /> HQ Grid Nodes ({filteredPosts.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition ${
                  activeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('critical')}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition ${
                  activeFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Alert
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredPosts.map((hub) => {
              const isSelected = selectedHub?.id === hub.id;
              const isCritical = hub.alertLevel === 'Critical';
              const isWarning = hub.alertLevel === 'Warning';

              return (
                <div
                  key={hub.id}
                  onClick={() => handleHubSelect(hub)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-white font-sans line-clamp-1">
                      {hub.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {hub.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Video className="w-3 h-3" /> {hub.feeds.toLocaleString()} CCTVs
                    </span>
                    <span className="text-[10px] text-slate-500">{hub.city}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* District Status Footer */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> All 33 Dists Linked
            </span>
            <span className="text-blue-400 font-bold">80,000 Live</span>
          </div>
        </div>

        {/* Right Side: Leaflet Light Mode Map Canvas */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-700 bg-slate-100 overflow-hidden shadow-2xl relative flex flex-col">
          <div 
            ref={mapElementRef} 
            className="w-full h-full min-h-[420px] relative z-0"
            style={{ background: '#e2e8f0' }}
          />

          {/* Overlay HUD Pill */}
          <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md border border-slate-300 rounded-xl px-3 py-2 pointer-events-none shadow-md">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-800">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>GIS MAP MODE: <b className="text-blue-600">LIGHT HIGH-CONTRAST</b></span>
            </div>
            {selectedHub && (
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                Target: <b className="text-slate-900">{selectedHub.name}</b> ({selectedHub.lat.toFixed(3)}, {selectedHub.lng.toFixed(3)})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
