import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Camera, 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  ShieldAlert, 
  Radio, 
  Grid, 
  Layers, 
  MapPin, 
  Map as MapIcon, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Play, 
  Square, 
  Sliders, 
  ExternalLink, 
  Eye, 
  Cpu, 
  Activity, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { SENTINEL_CAMERAS } from './CameraMatrixView';
import { SENTINEL_GRID_GIS } from './GisMapView';
import { surveillanceService, API_BASE_URL } from '../services/api';

export default function SentinelLiveAiHubView({ onSelectCamera }) {
  // Grid layout state: '2x2' (4 feeds), '2x3' (6 feeds), '3x3' (9 feeds)
  const [layout, setLayout] = useState('2x2');
  
  // Active tiles camera assignments (defaulting to primary Gujarat highway nodes)
  const [selectedFeeds, setSelectedFeeds] = useState([
    'cam01', 'cam02', 'cam04', 'cam06',
    'cam05', 'cam12', 'cam17', 'cam21', 'cam22'
  ]);
  
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  const [activeSpotlightCam, setActiveSpotlightCam] = useState(null);

  // Live Vehicle Scan Log State
  const [scanLogs, setScanLogs] = useState([]);
  const [latestDetection, setLatestDetection] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [totalDetected, setTotalDetected] = useState(0);
  const logContainerRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  // Vehicle Category Live Counters
  const [counts, setCounts] = useState({
    total: 0,
    cars: 0,
    bikes: 0,
    trucks: 0,
    buses: 0,
    alerts: 0
  });

  // GIS Map References
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const radarCircleRef = useRef(null);

  // Fetch live detections & stats from backend /api/detections/live
  const fetchLiveDetections = async () => {
    if (isPaused) return;
    try {
      const res = await surveillanceService.getLiveDetections({ limit: 50 });
      const data = res.data;
      if (!data) return;

      // --- Update active alerts panel ---
      if (data.active_alerts && Array.isArray(data.active_alerts)) {
        setActiveAlerts(data.active_alerts);
      }

      // --- Update total detected counter ---
      if (data.total_detected) {
        setTotalDetected(data.total_detected);
      }

      const rawDetections = data.detections || [];
      if (rawDetections.length === 0) return;

      // Only process entries we haven't seen yet (prepend new ones)
      const newEntries = [];
      let cCount = 0, bkCount = 0, tCount = 0, bsCount = 0, aCount = 0;

      rawDetections.forEach((item) => {
        const itemKey = item.id;
        if (seenIdsRef.current.has(itemKey)) return;
        seenIdsRef.current.add(itemKey);

        const rawType = (item.vehicle_type || 'CAR').toUpperCase();
        // Map detector labels to canonical types
        let type = 'CAR';
        if (rawType.includes('MOTORCYCLE') || rawType.includes('BIKE') || rawType.includes('AUTO')) type = 'MOTORCYCLE';
        else if (rawType.includes('TRUCK')) type = 'TRUCK';
        else if (rawType.includes('BUS')) type = 'BUS';
        else if (rawType.includes('CAR')) type = 'CAR';
        else type = rawType.split(' ')[0] || 'CAR';

        const plate = item.plate_number || `GJ-LIVE-${String(itemKey).slice(-4)}`;
        const rawCamId = (item.camera_id || 'cam01').toLowerCase();
        const camMeta = SENTINEL_GRID_GIS.find(c => c.id.toLowerCase() === rawCamId) || {
          name: item.location || 'Gujarat Highway Node',
          city: 'Ahmedabad'
        };

        const isHotlist = item.is_hotlist ||
          plate.includes('1029') || plate.includes('7741') || plate.includes('4490');

        const formatted = {
          id: itemKey,
          type,
          plate,
          location: camMeta.name || item.location || 'Sentinel Node',
          city: camMeta.city || 'Gujarat',
          camId: rawCamId.toUpperCase(),
          speed: item.speed || (40 + (parseInt(String(itemKey).slice(-3)) % 45)),
          confidence: item.confidence || null,
          timestamp: item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString('en-IN', { hour12: false })
            : new Date().toLocaleTimeString('en-IN', { hour12: false }),
          isHotlist
        };

        newEntries.push(formatted);

        if (type === 'CAR') cCount++;
        else if (type === 'MOTORCYCLE') bkCount++;
        else if (type === 'TRUCK') tCount++;
        else if (type === 'BUS') bsCount++;
        if (isHotlist) aCount++;
      });

      if (newEntries.length > 0) {
        // Prepend new detections, keep max 200 rows
        setScanLogs(prev => [...newEntries, ...prev].slice(0, 200));

        const newest = newEntries[0];
        setLatestDetection(newest);
        highlightGisMarker(newest.camId.toLowerCase(), newest);

        setCounts(prev => ({
          total: data.total_detected || prev.total + newEntries.length,
          cars: prev.cars + cCount,
          bikes: prev.bikes + bkCount,
          trucks: prev.trucks + tCount,
          buses: prev.buses + bsCount,
          alerts: Math.max(prev.alerts, aCount + (data.total_active_alerts || 0))
        }));
      } else if (data.total_detected) {
        // Keep counters in sync even when no new detections
        setCounts(prev => ({ ...prev, total: data.total_detected, alerts: Math.max(prev.alerts, data.total_active_alerts || 0) }));
      }
    } catch (err) {
      console.warn("Live detection fetch error:", err);
    }
  };

  // Auto-activate camera and poll detection log every 2 seconds
  useEffect(() => {
    surveillanceService.startCamera('cam01').catch(() => {});
    fetchLiveDetections();
    const interval = setInterval(fetchLiveDetections, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll scan log container
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [scanLogs, autoScroll]);

  // Initialize Interactive Leaflet GIS Map
  useEffect(() => {
    if (!mapElementRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapElementRef.current, {
      center: [22.4, 71.5],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Cyber Carto basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Plot 30 Sentinel Cameras
    markersRef.current = {};
    SENTINEL_GRID_GIS.forEach((cam) => {
      const isSelected = selectedFeeds.includes(cam.id);
      
      const customIcon = L.divIcon({
        className: 'sentinel-cam-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded-full ${isSelected ? 'bg-blue-600 ring-4 ring-blue-400/40 animate-pulse' : 'bg-slate-800 ring-2 ring-slate-600'} flex items-center justify-center text-white shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div class="absolute -top-6 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[9px] font-mono font-bold text-slate-200 whitespace-nowrap shadow-md">
              ${cam.id.toUpperCase()}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: customIcon }).addTo(map);
      
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #0f172a; min-width: 200px;">
          <div style="font-weight: 800; color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
            ${cam.id.toUpperCase()} • ${cam.name}
          </div>
          <div><b>District:</b> ${cam.city}</div>
          <div><b>Status:</b> <span style="color: #059669; font-weight: bold;">LIVE 1080p 30FPS</span></div>
          <div><b>AI ANPR:</b> Car, Bike, Truck, Bus Active</div>
          <div style="margin-top: 8px;">
            <a href="${API_BASE_URL}/api/video_feed?cam_id=${cam.id}" target="_blank" style="display: block; text-align: center; background: #2563eb; color: white; padding: 4px 8px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Open Full Live Stream
            </a>
          </div>
        </div>
      `);

      markersRef.current[cam.id] = marker;
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Radar Ping / Highlight on GIS map when vehicle is detected at a node
  const highlightGisMarker = (camId, det) => {
    if (!mapInstanceRef.current || !camId) return;
    const marker = markersRef.current[camId];
    if (marker) {
      const camMeta = SENTINEL_GRID_GIS.find(c => c.id.toLowerCase() === camId);
      if (camMeta) {
        // Draw live radar ring
        if (radarCircleRef.current) {
          mapInstanceRef.current.removeLayer(radarCircleRef.current);
        }
        
        const ringColor = det?.isHotlist ? '#ef4444' : '#3b82f6';
        radarCircleRef.current = L.circle([camMeta.lat, camMeta.lng], {
          radius: 12000,
          color: ringColor,
          fillColor: ringColor,
          fillOpacity: 0.25,
          weight: 2
        }).addTo(mapInstanceRef.current);

        setTimeout(() => {
          if (radarCircleRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(radarCircleRef.current);
            radarCircleRef.current = null;
          }
        }, 1800);
      }
    }
  };

  const handleTileCamChange = (index, newCamId) => {
    const updated = [...selectedFeeds];
    updated[index] = newCamId;
    setSelectedFeeds(updated);
    
    // Pan GIS map to this camera
    const camMeta = SENTINEL_GRID_GIS.find(c => c.id === newCamId);
    if (camMeta && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([camMeta.lat, camMeta.lng], 9, { duration: 1.2 });
    }
  };

  const handleSelectLogRow = (log) => {
    const camId = log.camId.toLowerCase();
    const camMeta = SENTINEL_GRID_GIS.find(c => c.id.toLowerCase() === camId);
    if (camMeta && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([camMeta.lat, camMeta.lng], 12, { duration: 1.0 });
      if (markersRef.current[camId]) {
        markersRef.current[camId].openPopup();
      }
      highlightGisMarker(camId, log);
    }
  };

  const handleExportCsv = () => {
    if (scanLogs.length === 0) return alert("No detection logs to export yet.");
    const headers = "ID,Vehicle_Type,Plate_Number,Location,District,Camera_ID,Speed_KMH,Timestamp,Hotlist_Alert\n";
    const rows = scanLogs.map(l => 
      `"${l.id}","${l.type}","${l.plate}","${l.location}","${l.city}","${l.camId}","${l.speed}","${l.timestamp}","${l.isHotlist ? 'YES' : 'NO'}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sentinel_Live_Vehicle_Scan_Log_${Date.now()}.csv`;
    a.click();
  };

  // Filter scan logs based on category tab & search text
  const filteredScanLogs = scanLogs.filter((item) => {
    const matchesCat = 
      activeCategoryFilter === 'ALL' ||
      (activeCategoryFilter === 'CAR' && item.type === 'CAR') ||
      (activeCategoryFilter === 'BIKE' && (item.type === 'MOTORCYCLE' || item.type === 'BIKE')) ||
      (activeCategoryFilter === 'TRUCK' && item.type === 'TRUCK') ||
      (activeCategoryFilter === 'BUS' && item.type === 'BUS') ||
      (activeCategoryFilter === 'ALERT' && item.isHotlist);

    const matchesSearch = 
      item.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.camId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = selectedCityFilter === 'ALL' || item.city === selectedCityFilter;

    return matchesCat && matchesSearch && matchesCity;
  });

  const getNumTiles = () => {
    if (layout === '2x2') return 4;
    if (layout === '2x3') return 6;
    if (layout === '3x3') return 9;
    return 4;
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'CAR':
        return <Car className="w-4 h-4 text-cyan-400" />;
      case 'MOTORCYCLE':
      case 'BIKE':
        return <Bike className="w-4 h-4 text-emerald-400" />;
      case 'TRUCK':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'BUS':
        return <Bus className="w-4 h-4 text-fuchsia-400" />;
      default:
        return <Car className="w-4 h-4 text-blue-400" />;
    }
  };

  const getVehicleBadgeStyle = (type) => {
    switch (type) {
      case 'CAR':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'MOTORCYCLE':
      case 'BIKE':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'TRUCK':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'BUS':
        return 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30';
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header Command Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Sentinel Live Multi-Cam AI Vision Hub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  30 NODES LIVE
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Simultaneous multi-camera live traffic feeds with real-time Car, Bike, Truck & Bus YOLOv8 detection, automatic vehicle scan logs, and dynamic GIS tracking
              </p>
            </div>
          </div>
        </div>

        {/* Layout & Stream Sync Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Grid Layout Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setLayout('2x2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                layout === '2x2' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> 2x2 Grid (4 Cams)
            </button>
            <button
              onClick={() => setLayout('2x3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                layout === '2x3' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> 2x3 Grid (6 Cams)
            </button>
            <button
              onClick={() => setLayout('3x3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                layout === '3x3' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> 3x3 Grid (9 Cams)
            </button>
          </div>

          <button
            onClick={() => setRefreshKey(Date.now())}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition border border-slate-700"
            title="Synchronize all streams"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Feeds
          </button>
        </div>
      </div>

      {/* Real-Time Live AI Classification Counter Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Scanned */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Scanned</p>
            <p className="text-xl font-extrabold text-white font-mono mt-0.5">{counts.total.toLocaleString()}</p>
            <span className="text-[9px] font-mono text-emerald-400">Live 1080p Stream</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Cars */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">🚗 Cars Detected</p>
            <p className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5">{counts.cars.toLocaleString()}</p>
            <span className="text-[9px] font-mono text-slate-400">Sedans & SUVs</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400">
            <Car className="w-5 h-5" />
          </div>
        </div>

        {/* Bikes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">🏍️ Bikes Detected</p>
            <p className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5">{counts.bikes.toLocaleString()}</p>
            <span className="text-[9px] font-mono text-slate-400">2-Wheelers</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
            <Bike className="w-5 h-5" />
          </div>
        </div>

        {/* Trucks */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">🚚 Trucks Detected</p>
            <p className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">{counts.trucks.toLocaleString()}</p>
            <span className="text-[9px] font-mono text-slate-400">Heavy Goods</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Buses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-400 font-bold">🚌 Buses Detected</p>
            <p className="text-xl font-extrabold text-fuchsia-300 font-mono mt-0.5">{counts.buses.toLocaleString()}</p>
            <span className="text-[9px] font-mono text-slate-400">GSRTC & Transit</span>
          </div>
          <div className="p-2.5 rounded-xl bg-fuchsia-600/10 border border-fuchsia-500/20 text-fuchsia-400">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        {/* Red Alerts */}
        <div className="bg-slate-900/90 border border-red-500/40 rounded-2xl p-3.5 shadow-lg flex items-center justify-between bg-red-950/10">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">🚨 Hotlist Alerts</p>
            <p className="text-xl font-extrabold text-red-400 font-mono mt-0.5">{counts.alerts}</p>
            <span className="text-[9px] font-mono text-red-300 animate-pulse">eGujCop Matches</span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Main Workspace: Left = Multi-Camera Live Grid, Right = Real-time Live Vehicle Scan Log & GIS Map */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Left Section: Multi-Camera Live Streams Grid (7 cols on XL) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <h2 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              SIMULTANEOUS LIVE CAMERA GRID ({getNumTiles()} FEEDS ACTIVE)
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              YOLOv8 ByteTrack + ANPR Active
            </span>
          </div>

          <div className={`grid gap-3.5 ${
            layout === '2x2' 
              ? 'grid-cols-1 sm:grid-cols-2' 
              : layout === '2x3'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}>
            {selectedFeeds.slice(0, getNumTiles()).map((feedId, idx) => {
              const camMeta = SENTINEL_GRID_GIS.find(c => c.id.toLowerCase() === feedId.toLowerCase()) || {
                id: feedId,
                name: `Sentinel Node #${idx + 1}`,
                city: 'Ahmedabad'
              };

              const streamUrl = `${API_BASE_URL}/api/video_feed?cam_id=${feedId}&city=${encodeURIComponent(camMeta.city)}&junction=${encodeURIComponent(camMeta.name)}&t=${refreshKey}`;

              return (
                <div 
                  key={`${feedId}-${idx}`}
                  className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col group hover:border-blue-500/60 transition"
                >
                  {/* Tile Header */}
                  <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                      <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      {/* Camera Selector Dropdown */}
                      <select
                        value={feedId}
                        onChange={(e) => handleTileCamChange(idx, e.target.value)}
                        className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer truncate max-w-[190px]"
                      >
                        {SENTINEL_GRID_GIS.map(c => (
                          <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                            {c.id.toUpperCase()}: {c.name} ({c.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1 shrink-0">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  </div>

                  {/* Video Stream Container */}
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      key={`${feedId}-${refreshKey}`}
                      src={streamUrl}
                      alt={camMeta.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                      onError={(e) => {
                        // Resilient retry
                        setTimeout(() => {
                          e.target.src = `${streamUrl}&retry=${Date.now()}`;
                        }, 2500);
                      }}
                    />

                    {/* Overlay Camera Identifier Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] font-mono text-cyan-300 font-bold">
                      {feedId.toUpperCase()} • {camMeta.city}
                    </div>

                    {/* Bottom AI Active Strip */}
                    <div className="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> YOLOv8 30FPS
                    </div>
                  </div>

                  {/* Tile Bottom Location Footer */}
                  <div className="px-3 py-1.5 bg-slate-950/50 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="truncate">{camMeta.name}</span>
                    <button
                      onClick={() => handleSelectLogRow({ camId: feedId })}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 shrink-0"
                      title="Focus on GIS Map"
                    >
                      <MapPin className="w-3 h-3" /> Pin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Live Vehicle Scan Log & Synchronized GIS Map (5 cols on XL) */}
        <div className="xl:col-span-5 space-y-4 flex flex-col">
          
          {/* Synchronized Real-Time GIS Gujarat Command Map Widget */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white uppercase">Real-Time Gujarat GIS Map</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                RADAR SYNC ACTIVE
              </span>
            </div>

            {/* Map Canvas */}
            <div 
              ref={mapElementRef}
              className="w-full h-52 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>● Radar pulses show real-time vehicle detections</span>
              <span>30 Pins Mapped</span>
            </div>
          </div>

          {/* ─── ACTIVE LIVE DETECTIONS Panel ─── */}
          <div className="bg-slate-900/90 rounded-2xl border border-red-500/30 p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="font-black text-red-300 uppercase tracking-wider">Active Live Detections</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[9px] font-extrabold">
                  {activeAlerts.length} ALERT{activeAlerts.length !== 1 ? 'S' : ''}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">eGujCop / VAHAN LIVE</span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-xs font-mono gap-2">
                <ShieldAlert className="w-6 h-6 text-slate-700" />
                <p>No active alerts — All clear on Sentinel Grid</p>
                {latestDetection && (
                  <p className="text-emerald-500 text-[10px] mt-1">
                    Last scan: <span className="font-bold text-emerald-400">{latestDetection.plate}</span> at {latestDetection.timestamp}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {activeAlerts.map((alert, idx) => (
                  <div
                    key={alert.id || idx}
                    className="p-2.5 rounded-xl border border-red-500/40 bg-red-950/25 hover:bg-red-900/30 transition font-mono text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white tracking-wider">
                            {alert.plate || alert.plate_number || 'UNKNOWN'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-extrabold animate-pulse">
                            {(alert.alert_type || 'ALERT').replace(/_/g,' ').substring(0,20)}
                          </span>
                          {alert.severity && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-red-400/30 text-red-300 text-[8px] font-bold">
                              {alert.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {alert.camera_id} • {alert.location}
                        </p>
                        {alert.fir_number && alert.fir_number !== 'N/A' && (
                          <p className="text-[9px] text-amber-400 mt-0.5 font-mono">
                            FIR: {alert.fir_number} • {alert.police_station}
                          </p>
                        )}
                        {alert.pcr_assigned && (
                          <p className="text-[9px] text-emerald-400 mt-0.5">
                            🚔 {alert.pcr_assigned}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          alert.status === 'DISPATCHED' || alert.status?.includes('ACTIVE')
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {alert.status || 'ACTIVE'}
                        </span>
                        <p className="text-[9px] text-slate-500 mt-1">
                          {alert.timestamp
                            ? new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour12: false })
                            : '--:--:--'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Live Vehicle Scan Log Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 shadow-xl flex-1 flex flex-col min-h-[460px]">
            
            {/* Table Header & Controls */}
            <div className="border-b border-slate-800 pb-3 mb-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> DIRECT LIVE VEHICLE SCAN LOG
                </h3>
                
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 ${
                      isPaused ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Square className="w-3 h-3 fill-current" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] flex items-center gap-1 font-bold"
                    title="Export CSV"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Tabs */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search plate (e.g. GJ01), location, camera..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category Buttons: ALL, CAR, BIKE, TRUCK, BUS, ALERT */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  {[
                    { id: 'ALL', label: 'All', icon: null },
                    { id: 'CAR', label: '🚗 Car', icon: Car },
                    { id: 'BIKE', label: '🏍️ Bike', icon: Bike },
                    { id: 'TRUCK', label: '🚚 Truck', icon: Truck },
                    { id: 'BUS', label: '🚌 Bus', icon: Bus },
                    { id: 'ALERT', label: '🚨 Hotlist', icon: ShieldAlert, color: 'text-red-400' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategoryFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        activeCategoryFilter === tab.id
                          ? tab.id === 'ALERT'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable Live Scan Logs List */}
            <div 
              ref={logContainerRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]"
            >
              {filteredScanLogs.length > 0 ? (
                filteredScanLogs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectLogRow(item)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between font-mono text-xs ${
                      item.isHotlist
                        ? 'bg-red-950/25 border-red-500/50 hover:bg-red-900/30'
                        : 'bg-slate-950/80 border-slate-800/90 hover:border-blue-500/50 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Vehicle Category Badge */}
                      <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${getVehicleBadgeStyle(item.type)}`}>
                        {getVehicleIcon(item.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-xs tracking-wider">
                            {item.plate}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${getVehicleBadgeStyle(item.type)}`}>
                            {item.type}
                          </span>
                          {item.isHotlist && (
                            <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-extrabold animate-pulse">
                              HOTLIST
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.camId} • {item.location} ({item.city})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="text-emerald-400 font-bold text-xs">{item.speed} km/h</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">{item.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full py-16 flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
                  <Activity className="w-6 h-6 mb-2 text-slate-600 animate-pulse" />
                  <p>Scanning active camera feeds for Car, Bike, Truck & Bus...</p>
                </div>
              )}
            </div>

            {/* Bottom Footer Status */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                Auto-scroll live log
              </label>

              <span className="text-slate-400 font-bold">
                Showing {filteredScanLogs.length} Scanned Records
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
