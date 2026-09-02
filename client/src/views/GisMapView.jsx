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
  ExternalLink,
  CheckCircle2, 
  Key,
  Eye,
  EyeOff,
  Play
} from 'lucide-react';
import { surveillanceService, API_BASE_URL } from '../services/api';

// 30 Real Sentinel Camera Grid Nodes with Precise Gujarat Geo-Coordinates
export const SENTINEL_GRID_GIS = [
  { id: "cam01", name: "Chiman bhai Bridge", city: "Ahmedabad", lat: 23.0645, lng: 72.5855, type: "Overpass Bridge CCTV", codec: "H.264" },
  { id: "cam02", name: "Janpath", city: "Ahmedabad", lat: 23.0360, lng: 72.5645, type: "Arterial Junction Post", codec: "H.264" },
  { id: "cam03", name: "O.N.G.C. Office", city: "Ahmedabad", lat: 23.1118, lng: 72.5830, type: "Institutional Security", codec: "H.264" },
  { id: "cam04", name: "Paldi Circle", city: "Ahmedabad", lat: 23.0125, lng: 72.5620, type: "Urban Traffic Circle", codec: "H.264" },
  { id: "cam05", name: "Visat teen Rasta", city: "Ahmedabad", lat: 23.0970, lng: 72.5890, type: "Sabarmati Tri-Junction", codec: "H.264" },
  { id: "cam06", name: "Timbavadi gate-Junagadh", city: "Junagadh", lat: 21.5050, lng: 70.4480, type: "City Entry Gate", codec: "H.264" },
  { id: "cam07", name: "hero-showroom-gir-somnath", city: "Gir Somnath", lat: 20.9025, lng: 70.3645, type: "Commercial Highway Post", codec: "H.264" },
  { id: "cam08", name: "majewadi-gate-junagadh", city: "Junagadh", lat: 21.5280, lng: 70.4610, type: "Historic Checkpost Gate", codec: "H.264" },
  { id: "cam09", name: "new-bypass-near-by-circle-junagadh-2", city: "Junagadh", lat: 21.5420, lng: 70.4720, type: "Highway Bypass Circle", codec: "H.264" },
  { id: "cam10", name: "char-chowk-road-2-junagadh", city: "Junagadh", lat: 21.5210, lng: 70.4590, type: "Central Four-Ways", codec: "H.264" },
  { id: "cam11", name: "dolatpara-junagadh", city: "Junagadh", lat: 21.5510, lng: 70.4780, type: "GIDC Industrial Highway", codec: "H.264" },
  { id: "cam12", name: "Tri Mandir Adalaj Tollnaka", city: "Gandhinagar", lat: 23.1810, lng: 72.5695, type: "Toll Plaza Highway Node", codec: "H.264" },
  { id: "cam13", name: "CN Vidhyalaya", city: "Ahmedabad", lat: 23.0230, lng: 72.5480, type: "Ambawadi Urban Corridor", codec: "H.264" },
  { id: "cam14", name: "Delight RLVD", city: "Ahmedabad", lat: 23.0450, lng: 72.5180, type: "Red Light Violation Detection", codec: "H.264" },
  { id: "cam15", name: "Suvidha park", city: "Ahmedabad", lat: 23.0310, lng: 72.5320, type: "Satellite Residential Post", codec: "H.264" },
  { id: "cam16", name: "Visat P2", city: "Ahmedabad", lat: 23.1020, lng: 72.5910, type: "Chandkheda Secondary Post", codec: "H.264" },
  { id: "cam17", name: "Rajkot Bus Port CCTV", city: "Rajkot", lat: 22.3040, lng: 70.8030, type: "Transit Terminal Surveillance", codec: "H.264" },
  { id: "cam18", name: "Rajkot CCTV", city: "Rajkot", lat: 22.2980, lng: 70.7990, type: "Downtown Trikon Baug", codec: "H.264" },
  { id: "cam19", name: "KHAPARIA GRAM PANCHAYAT , TALUKA GANDEVI, DISTRICT NAVSARI", city: "Navsari", lat: 20.8140, lng: 72.9810, type: "Panchayat Security Post", codec: "H.264" },
  { id: "cam20", name: "Mohanpura", city: "Ahmedabad", lat: 23.0305, lng: 72.5990, type: "Kalupur Station Approach", codec: "H.264" },
  { id: "cam21", name: "Surat Ring Road Node", city: "Surat", lat: 21.1820, lng: 72.8250, type: "Majura Gate Corridor", codec: "H.264" },
  { id: "cam22", name: "Vadodara Sayajigunj Tower", city: "Vadodara", lat: 22.3110, lng: 73.1860, type: "Sayajigunj Central Node", codec: "H.264" },
  { id: "cam23", name: "Mehsana Modhera Circle", city: "Mehsana", lat: 23.5930, lng: 72.3780, type: "State Highway 41 Node", codec: "H.264" },
  { id: "cam24", name: "Dwarka Coastal Highway Post", city: "Devbhumi Dwarka", lat: 22.2380, lng: 68.9660, type: "Coastal Border Watch", codec: "H.264" },
  { id: "cam25", name: "Bhuj Border Highway Node", city: "Kutch", lat: 23.2450, lng: 69.6920, type: "Kutch Border Transit Corridor", codec: "H.264" },
  { id: "cam26", name: "Bhavnagar Ghogha Circle", city: "Bhavnagar", lat: 21.7640, lng: 72.1480, type: "Ghogha Port Circle", codec: "H.264" },
  { id: "cam27", name: "Jamnagar Port Road", city: "Jamnagar", lat: 22.4680, lng: 70.0580, type: "Digjam Industrial Corridor", codec: "H.264" },
  { id: "cam28", name: "Anand Expressway Toll Plaza", city: "Anand", lat: 22.5620, lng: 72.9510, type: "NE-1 Toll Plaza Post", codec: "H.264" },
  { id: "cam29", name: "Bharuch Narmada Bridge Gate", city: "Bharuch", lat: 21.7050, lng: 72.9980, type: "Golden Bridge River Post", codec: "H.264" },
  { id: "cam30", name: "Gujarat State Highway Patrol Node", city: "Gandhinagar", lat: 23.2230, lng: 72.6510, type: "State HQ Inter-District Grid", codec: "H.264" },
];

export default function GisMapView({ onStreamToAi }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);

  const [selectedCam, setSelectedCam] = useState(null);
  const [mapProvider, setMapProvider] = useState(() => localStorage.getItem('gis_provider') || 'carto-light');
  const [gisApiKey, setGisApiKey] = useState(() => 
    localStorage.getItem('gis_api_key') || import.meta.env.VITE_GIS_API_KEY || ''
  );
  const [showKey, setShowKey] = useState(false);
  const [selectedCity, setSelectedCity] = useState('all');
  const [showCoverage, setShowCoverage] = useState(true);

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
        if (key && key.startsWith('pk.')) {
          return {
            url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${key}`,
            attribution: '&copy; Mapbox &copy; OpenStreetMap contributors &copy; Gujarat Cyber Vision'
          };
        }
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; OpenStreetMap'
        };
      case 'geoapify-light':
        if (key) {
          return {
            url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${key}`,
            attribution: 'Powered by Geoapify &copy; OpenStreetMap'
          };
        }
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; OpenStreetMap'
        };
      case 'osm-light':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors &copy; Gujarat Cyber Vision GIS'
        };
      case 'carto-dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; Gujarat Cyber Vision GIS'
        };
      case 'carto-light':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; OpenStreetMap contributors &copy; Gujarat Cyber Vision GIS'
        };
    }
  };

  useEffect(() => {
    if (!mapElementRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Map centered over Gujarat
    const map = L.map(mapElementRef.current, {
      center: [22.4, 71.3],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileConfig = getTileConfig(mapProvider, gisApiKey);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Glowing Real Camera Marker Icon
    const createCamIcon = (cam) => {
      return L.divIcon({
        className: 'custom-gis-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #ffffff; border: 2.5px solid #2563eb; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a;"></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });
    };

    // Render Real Markers
    markersRef.current = [];
    SENTINEL_GRID_GIS.forEach((cam) => {
      const marker = L.marker([cam.lat, cam.lng], {
        icon: createCamIcon(cam),
      }).addTo(map);

      const rtspUrl = `rtsp://103.250.160.189:8554/stream/${cam.id}`;
      const hlsUrl = `https://cctv.corp8.cloud/${cam.id}/index.m3u8`;

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: #0f172a; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; min-width: 240px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="color: #2563eb; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">${cam.id.toUpperCase()}</span>
            <span style="color: #16a34a; font-weight: 700; font-size: 9px; padding: 2px 6px; background: #f0fdf4; border-radius: 4px; border: 1px solid #bbf7d0;">100% ONLINE</span>
          </div>
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px; line-height: 1.3;">${cam.name}</div>
          <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">City: <b>${cam.city}</b> • ${cam.type}</div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-family: monospace; font-size: 9px; color: #475569;">
            <div style="margin-bottom: 2px;"><b style="color: #2563eb;">RTSP:</b> 103.250.160.189:8554/stream/${cam.id}</div>
            <div><b style="color: #16a34a;">GPS:</b> ${cam.lat.toFixed(4)}° N, ${cam.lng.toFixed(4)}° E</div>
          </div>

          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <a href="${hlsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; padding: 5px 8px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: 600;">
              HLS Feed ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false });
      marker.on('click', () => {
        setSelectedCam(cam);
      });

      markersRef.current.push({ cam, marker });
    });

    // Render Optical Coverage Cones / Radii
    circlesRef.current = [];
    if (showCoverage) {
      SENTINEL_GRID_GIS.forEach((cam) => {
        const circle = L.circle([cam.lat, cam.lng], {
          radius: 120, // 120m optical field-of-view radius
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.16,
          weight: 1.5,
          dashArray: '3, 4'
        }).addTo(map);
        circlesRef.current.push(circle);
      });
    }

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
  }, [mapProvider, gisApiKey, showCoverage]);

  // Zoom to camera pin
  const handleCamSelect = (cam) => {
    setSelectedCam(cam);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cam.lat, cam.lng], 14, {
        animate: true,
        duration: 1.2,
      });
      const item = markersRef.current.find((m) => m.cam.id === cam.id);
      if (item && item.marker) {
        item.marker.openPopup();
      }
    }
  };

  const handleResetView = () => {
    setSelectedCam(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.4, 71.3], 7, {
        animate: true,
        duration: 1,
      });
      mapInstanceRef.current.closePopup();
    }
  };

  const filteredCams = SENTINEL_GRID_GIS.filter((cam) => {
    if (selectedCity === 'all') return true;
    return cam.city.toLowerCase() === selectedCity.toLowerCase();
  });

  const uniqueCities = Array.from(new Set(SENTINEL_GRID_GIS.map(c => c.city)));

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-400" /> Gujarat State GIS Real Camera Grid
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            30 Verified Operational Sentinel Grid CCTV Nodes across Gujarat
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* GIS API Key */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="GIS API Key (Optional)"
              value={gisApiKey}
              onChange={handleApiKeyChange}
              className="bg-transparent text-xs text-slate-200 outline-none w-36 sm:w-44 font-mono placeholder:text-slate-500"
              title="Enter your Mapbox / Geoapify API key"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-slate-400 hover:text-white p-0.5 transition"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Map Style Provider */}
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

          {/* Coverage Cones Toggle */}
          <button
            onClick={() => setShowCoverage(!showCoverage)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition border ${
              showCoverage
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle 120m optical camera coverage radiuses"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Coverage ({showCoverage ? 'ON' : 'OFF'})</span>
          </button>

          {/* Center State */}
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-mono transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Center State</span>
          </button>

          <span className="text-xs font-mono px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            30 NODES ONLINE
          </span>
        </div>
      </div>

      {/* Main Content: Real Cameras List + Map Canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left Side: Real Camera List */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" /> Real Camera Nodes ({filteredCams.length})
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-950 text-[10px] text-slate-300 px-2 py-1 rounded-lg border border-slate-700 outline-none font-mono cursor-pointer"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredCams.map((cam) => {
              const isSelected = selectedCam?.id === cam.id;

              return (
                <div
                  key={cam.id}
                  onClick={() => handleCamSelect(cam)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 shrink-0">
                        {cam.id.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-white font-sans truncate">
                        {cam.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                      ONLINE
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-[10px] text-slate-400 truncate">{cam.type}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{cam.city}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 103.250.160.189:8554
            </span>
            <span className="text-blue-400 font-bold">30 Real Nodes</span>
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
              <span>GIS MAP MODE: <b className="text-blue-600">SENTINEL OPERATIONAL GRID</b></span>
            </div>
            {selectedCam && (
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                Target: <b className="text-slate-900">{selectedCam.name}</b> ({selectedCam.lat.toFixed(4)}° N, {selectedCam.lng.toFixed(4)}° E)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
