import React, { useState, useEffect } from 'react';
import {
  Network,
  Cpu,
  Layers,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Radio,
  Plus,
  FileText,
  ArrowRight,
  Server,
  Gauge,
  Clock,
  Zap,
  ChevronRight,
  ExternalLink,
  Car,
  Camera,
  Filter,
  Download,
  X,
  Building2,
  Lock,
  Eye,
  Sliders
} from 'lucide-react';
import { surveillanceService, API_BASE_URL } from '../services/api';

export default function VmsFederationHubView() {
  const [overview, setOverview] = useState(null);
  const [systems, setSystems] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [selectedSystem, setSelectedSystem] = useState('ALL');
  const [hotlistOnly, setHotlistOnly] = useState(false);

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    system_name: '',
    department: '',
    vendor_type: 'Hikvision HikCentral',
    protocol: 'RTSP / ONVIF Profile S',
    endpoint: '192.168.10.50:8000'
  });
  const [onboardSuccess, setOnboardSuccess] = useState('');

  // Active Stream Selection
  const [activeStreamId, setActiveStreamId] = useState('cam01');

  const handleSwitchCamera = (camId) => {
    if (!camId) return;
    setActiveStreamId(camId);
    setRefreshKey(Date.now());
    surveillanceService.setStreamSource(camId).catch((err) => {
      console.warn('Set stream source notice:', err);
    });
  };

  const fetchFederationData = async () => {
    try {
      setLoading(true);
      const [ovRes, sysRes, corrRes, evtRes] = await Promise.all([
        surveillanceService.getFederationOverview(),
        surveillanceService.getFederatedSystems(),
        surveillanceService.getCrossSystemCorrelations(),
        surveillanceService.getFederatedEvents({ limit: 40 })
      ]);

      setOverview(ovRes.data);
      setSystems(sysRes.data?.systems || []);
      setCorrelations(corrRes.data?.correlations || []);
      setEvents(evtRes.data?.events || []);
    } catch (err) {
      console.error('Failed to load federation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFederationData();
    const interval = setInterval(fetchFederationData, 10000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await surveillanceService.onboardVmsAdapter(formData);
      setOnboardSuccess(res.data?.message || 'VMS Adapter onboarded successfully!');
      setTimeout(() => {
        setShowOnboardModal(false);
        setOnboardSuccess('');
        fetchFederationData();
      }, 1500);
    } catch (err) {
      alert('Error onboarding VMS adapter. Check endpoint format.');
    }
  };

  const handleOpenReport = async () => {
    setShowReportModal(true);
    try {
      setReportLoading(true);
      const res = await surveillanceService.getFederatedAnalyticsReport();
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setReportLoading(false);
    }
  };

  const filteredEvents = events.filter(evt => {
    if (selectedSystem !== 'ALL' && evt.source_system_id !== selectedSystem) return false;
    if (hotlistOnly && !evt.is_hotlist_match) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-inner">
            <Network className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Model 3 Core
              </span>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                VMS Federation & Middleware Integration Layer
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                INTEROPERABILITY ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-system middleware federating heterogeneous departmental CCTV platforms (Police City VMS + NHAI Highway Tolls + ONVIF Bridges)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setRefreshKey(Date.now())}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition shadow"
            title="Refresh All Feeds"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Hub</span>
          </button>

          <button
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-300 transition shadow"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Analytics Report</span>
          </button>

          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard VMS Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Federated VMS Nodes</div>
            <div className="text-xl font-black text-white mt-0.5">
              {overview?.federated_systems_count || 2} <span className="text-xs font-normal text-slate-400">Platforms</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">100% Handshake Active</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <Radio className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Federated Cameras</div>
            <div className="text-xl font-black text-white mt-0.5">
              {overview?.active_cameras || 12} <span className="text-xs font-normal text-slate-400">Streams</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">RTSP / ONVIF Profile S</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Cpu className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Event Bus Telemetry</div>
            <div className="text-xl font-black text-white mt-0.5">
              11.2 <span className="text-xs font-normal text-slate-400">ms Latency</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">0.00% Packet Loss</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Correlated Incidents</div>
            <div className="text-xl font-black text-white mt-0.5">
              {overview?.active_correlations_count || correlations.length} <span className="text-xs font-normal text-red-400 font-bold">Alerts</span>
            </div>
            <div className="text-[10px] text-red-400 font-mono mt-0.5">Cross-System Hotlist Tracked</div>
          </div>
        </div>
      </div>

      {/* Model 3 Visual Architecture Flow Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Federation Architecture Pipeline (Live State)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400">STEP 1: SOURCES</div>
            <div className="font-bold text-white mt-1">Multi-Vendor VMS</div>
            <div className="text-[11px] text-slate-400 mt-1">Police City + NHAI Tolls</div>
          </div>
          <div className="bg-slate-900/90 border border-blue-500/20 p-3 rounded-xl">
            <div className="text-[10px] text-blue-400">STEP 2: CONNECTORS</div>
            <div className="font-bold text-white mt-1">VMS Adapters</div>
            <div className="text-[11px] text-slate-400 mt-1">RTSP • ONVIF • REST SDK</div>
          </div>
          <div className="bg-slate-900/90 border border-indigo-500/20 p-3 rounded-xl">
            <div className="text-[10px] text-indigo-400">STEP 3: CORE</div>
            <div className="font-bold text-white mt-1">Middleware Layer</div>
            <div className="text-[11px] text-slate-400 mt-1">Auth & Orchestration</div>
          </div>
          <div className="bg-slate-900/90 border border-cyan-500/20 p-3 rounded-xl">
            <div className="text-[10px] text-cyan-400">STEP 4: MESSAGING</div>
            <div className="font-bold text-white mt-1">Metadata Event Bus</div>
            <div className="text-[11px] text-slate-400 mt-1">Async Pub/Sub Router</div>
          </div>
          <div className="bg-slate-900/90 border border-emerald-500/20 p-3 rounded-xl">
            <div className="text-[10px] text-emerald-400">STEP 5: UNIFIED UI</div>
            <div className="font-bold text-white mt-1">Correlation Hub</div>
            <div className="text-[11px] text-slate-400 mt-1">Unified Workflows</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Federated Systems & Live Stream, Right = Cross-System Correlation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Federated VMS Systems & Stream Monitor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Federated Platforms Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Connected VMS Platforms (Interoperability Nodes)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {systems.length} Active Adapters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {systems.map((sys) => {
                const isOnline = sys.health?.is_online;
                return (
                  <div
                    key={sys.metadata.system_id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-indigo-500/40 transition shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {sys.metadata.system_name}
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {sys.metadata.department}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {sys.metadata.vendor_type.split(' ')[0]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-400">Protocol:</span>
                        <div className="text-slate-200 truncate">{sys.metadata.protocol}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Latency:</span>
                        <div className="text-emerald-400 font-bold">{sys.health?.latency_ms || 12} ms</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Active Nodes:</span>
                        <div className="text-white font-bold">{sys.cameras?.length || sys.health?.active_cameras} Cams</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Endpoint:</span>
                        <div className="text-slate-300 truncate">{sys.metadata.base_endpoint}</div>
                      </div>
                    </div>

                    {/* Camera Dropdown & Quick Selector */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1 font-bold text-slate-300">
                          <Camera className="w-3 h-3 text-cyan-400" />
                          Select Live Camera Node:
                        </span>
                        <span className="text-[9px] text-cyan-400 font-bold">
                          {sys.cameras?.length || 0} Available
                        </span>
                      </div>

                      {/* Dropdown Select Menu for all Cameras */}
                      <select
                        value={sys.cameras?.some(c => c.id === activeStreamId) ? activeStreamId : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSwitchCamera(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-indigo-500 text-white font-mono text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-inner transition"
                      >
                        <option value="" disabled>-- Choose Camera ({sys.metadata.system_name.split(' ')[0]}) --</option>
                        {sys.cameras?.map((cam) => (
                          <option key={cam.id} value={cam.id} className="bg-slate-950 text-slate-100 py-1">
                            {cam.id.toUpperCase()}: {cam.name} ({cam.location})
                          </option>
                        ))}
                      </select>

                      {/* Quick Shortcut Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 max-h-24 overflow-y-auto pr-1">
                        {sys.metadata.system_id === 'vms-node-02-tollnhai' && (
                          <button
                            type="button"
                            onClick={() => handleSwitchCamera('cam12')}
                            className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition shadow ${activeStreamId === 'cam12'
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                              }`}
                          >
                            <Zap className="w-3 h-3" />
                            Tri Mandir (CAM12)
                          </button>
                        )}

                        {sys.cameras?.map((cam) => (
                          <button
                            key={cam.id}
                            type="button"
                            onClick={() => handleSwitchCamera(cam.id)}
                            className={`text-[9px] font-mono px-2 py-0.5 rounded transition ${activeStreamId === cam.id
                                ? 'bg-blue-600 text-white font-bold shadow ring-1 ring-blue-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                          >
                            ▶ {cam.id.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unified Federated Live Stream Monitor */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-white uppercase">
                  Federated Live Video Bridge
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                  {activeStreamId.toUpperCase()}
                </span>
              </div>

              {/* Direct Quick Stream Switcher Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={activeStreamId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                >
                  <optgroup label="Gujarat Police City VMS">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const id = `cam${String(i + 1).padStart(2, '0')}`;
                      return (
                        <option key={id} value={id}>
                          {id.toUpperCase()} - Node #{i + 1}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="NHAI Highway Toll Nodes">
                    <option value="cam12">CAM12: Tri Mandir Tollnaka</option>
                    <option value="toll-ne1-01">NE-1 Expressway Toll (CAM12)</option>
                    <option value="toll-ne1-02">NE-1 Anand Interchange (CAM05)</option>
                    <option value="toll-nh48-03">NH-48 Kamrej Toll (CAM17)</option>
                    <option value="toll-nh27-04">NH-27 Bamanbore Toll (CAM07)</option>
                  </optgroup>
                </select>

                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded font-bold">
                  YOLOv8 + ANPR ACTIVE
                </span>
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                key={`${activeStreamId}-${refreshKey}`}
                src={`${API_BASE_URL}/api/video_feed?cam_id=${activeStreamId}&t=${refreshKey}`}
                alt="Federated Video Stream"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-white flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold">LIVE FEED: {activeStreamId.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cross-System Correlation Engine (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Cross-System Correlation Engine
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Model 3 Deliverable 2: Inter-System Spatio-Temporal Target Tracking
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold">
                {correlations.length} Correlated
              </span>
            </div>

            {/* Correlated Incidents List */}
            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {correlations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-mono">
                  No cross-system targets currently in transit.
                </div>
              ) : (
                correlations.map((corr) => {
                  const isCritical = corr.severity === 'CRITICAL';
                  return (
                    <div
                      key={corr.incident_id}
                      className={`p-4 rounded-xl border transition shadow-lg ${isCritical
                          ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                          : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono tracking-wider bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                              {corr.plate_number}
                            </span>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${isCritical
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                              {corr.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-bold mt-1">
                            {corr.alert_type} ({corr.vehicle_class})
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-cyan-400">
                            ~{corr.transit_speed_kmh} km/h
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {corr.time_delta_minutes} min transit
                          </div>
                        </div>
                      </div>

                      {/* Escalation Reason */}
                      <p className="text-[11px] text-slate-300 mt-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                        {corr.escalation_reason}
                      </p>

                      {/* Trajectory Timeline Flow */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[9px] font-mono uppercase text-slate-400 font-bold">
                          Multi-System Sightings Trajectory:
                        </div>
                        {corr.trajectory?.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                            <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-400 shrink-0">
                              {step.step}
                            </span>
                            <span className="text-cyan-400 font-bold shrink-0">{step.system.split(' ')[0]}:</span>
                            <span className="truncate">{step.location}</span>
                            <span className="text-[9px] text-slate-400 ml-auto shrink-0">
                              {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Metadata & Event Stream Bus */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Metadata & Event Exchange Bus
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Real-time aggregated stream from all connected VMS platform adapters
              </p>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-mono px-3 py-1.5 rounded-xl outline-none"
            >
              <option value="ALL">All VMS Platforms</option>
              {systems.map(s => (
                <option key={s.metadata.system_id} value={s.metadata.system_id}>
                  {s.metadata.system_name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setHotlistOnly(!hotlistOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition ${hotlistOnly
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Hotlist Only
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="p-3">Source VMS System</th>
                <th className="p-3">Camera Node</th>
                <th className="p-3">License Plate</th>
                <th className="p-3">Class</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Hotlist Status</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.map((evt) => (
                <tr key={evt.event_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {evt.source_system_name}
                  </td>
                  <td className="p-3 text-slate-300">{evt.camera_location}</td>
                  <td className="p-3">
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-800">
                      {evt.plate_number}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{evt.vehicle_class}</td>
                  <td className="p-3 text-emerald-400 font-bold">{(evt.confidence * 100).toFixed(1)}%</td>
                  <td className="p-3">
                    {evt.is_hotlist_match ? (
                      <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        {evt.hotlist_category || 'MATCH'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">CLEARED</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ONBOARD NEW VMS ADAPTER (DELIVERABLE 1 & CONNECTOR FRAMEWORK)     */}
      {/* ========================================================================= */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Onboard New VMS Adapter / Connector</h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-5 space-y-4 text-xs font-sans">
              {onboardSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  {onboardSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">VMS System Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surat Municipal Corporation Smart City VMS"
                  value={formData.system_name}
                  onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 transition font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urban Development"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 transition font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vendor Platform</label>
                  <select
                    value={formData.vendor_type}
                    onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 transition font-mono text-xs"
                  >
                    <option value="Hikvision HikCentral">Hikvision HikCentral</option>
                    <option value="Milestone XProtect">Milestone XProtect</option>
                    <option value="Dahua DSS Pro">Dahua DSS Pro</option>
                    <option value="Axis Camera Station">Axis Camera Station</option>
                    <option value="ONVIF Profile S/G/T Bridge">ONVIF Generic Bridge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Integration Protocol</label>
                  <select
                    value={formData.protocol}
                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 transition font-mono text-xs"
                  >
                    <option value="RTSP / ONVIF Profile S">RTSP / ONVIF Profile S</option>
                    <option value="REST API + Webhook">REST API + Webhook</option>
                    <option value="gRPC Streaming Gateway">gRPC Streaming Gateway</option>
                    <option value="Kafka Message Broker">Kafka Message Broker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Endpoint / Host</label>
                  <input
                    type="text"
                    required
                    placeholder="10.20.30.40:8000"
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 transition font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition"
                >
                  Deploy Adapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FEDERATED ANALYTICS REPORT (DELIVERABLE 4)                       */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Sample Federated Analytics Report (Model 3)</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              {reportLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  Generating Federated Multi-System Intelligence Report...
                </div>
              ) : reportData ? (
                <>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                      {reportData.classification}
                    </div>
                    <div className="text-base font-bold text-white">{reportData.report_title}</div>
                    <div className="text-[10px] text-slate-400">
                      Report ID: {reportData.report_id} • Generated: {new Date(reportData.generated_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Executive Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.entries(reportData.executive_summary).map(([k, v]) => (
                        <div key={k} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">{k.replace(/_/g, ' ')}:</span>
                          <span className="text-white font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Correlated Targets */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Top Cross-System Correlated Targets</h4>
                    <div className="space-y-2">
                      {reportData.top_correlated_targets?.map((t, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-amber-300 font-bold">{t.target_plate}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {t.origin_system.split(' ')[0]} ➔ {t.destination_system.split(' ')[0]} ({t.travel_time_minutes} min)
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-cyan-400">
                            ~{t.estimated_speed_kmh} km/h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Policy Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {reportData.recommendations?.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>

            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">Model 3 Interoperability Standard</span>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `federation_report_${Date.now()}.json`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
