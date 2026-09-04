import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Scan, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Car, 
  Bike,
  Truck,
  Bus,
  Radio,
  FileText, 
  Search,
  Zap,
  Activity,
  Eye,
  Upload,
  Check,
  SwitchCamera,
  Smartphone,
  RotateCw,
  Sun,
  Flashlight
} from 'lucide-react';
import { surveillanceService, API_BASE_URL } from '../services/api';

const QUICK_TEST_PLATES = [
  { plate: 'GJ01AB1234', label: 'Stolen Creta (Red Alert)', category: 'CAR', type: 'danger' },
  { plate: 'GJ05CD5678', label: 'Wanted Truck (Red Alert)', category: 'TRUCK', type: 'danger' },
  { plate: 'GJ10XY4321', label: 'Cyber Fraud Swift (Red Alert)', category: 'CAR', type: 'danger' },
  { plate: 'GJ03EF9999', label: 'Suspicious Bike (Yellow Alert)', category: 'BIKE', type: 'warning' },
  { plate: 'GJ01TT8921', label: 'Ahmedabad Auto-Rickshaw (Clean)', category: 'AUTO', type: 'success' },
  { plate: 'GJ18BS3410', label: 'Gandhinagar GSRTC Bus (Clean)', category: 'BUS', type: 'success' },
  { plate: 'GJ27EB4004', label: 'Ahmedabad East Vastral (Clean)', category: 'BIKE', type: 'success' },
  { plate: 'GJ06GH3456', label: 'Vadodara Nexon (Clean)', category: 'CAR', type: 'success' }
];

export default function LaptopCamScannerView() {
  const [cameraActive, setCameraActive] = useState(true);
  const [useBrowserCam, setUseBrowserCam] = useState(true);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (Back Camera) or 'user' (Front Camera)
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [streamError, setStreamError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  
  const [currentResult, setCurrentResult] = useState({
    status: 'success',
    found: true,
    plate_number: 'GJ-01-AB-1234',
    formatted_plate: 'GJ-01-AB-1234',
    raw_text: 'GJ01AB1234',
    rto_district: 'Ahmedabad (City - Subhash Bridge)',
    state: 'Gujarat',
    vehicle_type: 'CAR',
    confidence: 0.98,
    is_alert: true,
    watchlist_data: {
      owner: "Ramesh P. Solanki (Reported Stolen)",
      vehicle_type: "Car (Hyundai Creta - White)",
      status: "STOLEN_VEHICLE",
      fir_number: "FIR/2026/AHM/4092",
      police_station: "Satellite Police Station, Ahmedabad",
      crime_category: "Vehicle Theft / Robbery Case",
      action_required: "Intercept Vehicle Immediately - Alert Nearest PCR Van"
    }
  });

  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [customPlateInput, setCustomPlateInput] = useState('');
  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      plate: 'GJ-01-AB-1234',
      vehicle_type: 'CAR',
      rto: 'Ahmedabad (City)',
      status: 'STOLEN_VEHICLE',
      isAlert: true,
      time: new Date(Date.now() - 45000).toLocaleTimeString()
    },
    {
      id: 2,
      plate: 'GJ-05-CD-5678',
      vehicle_type: 'TRUCK',
      rto: 'Surat (Central)',
      status: 'WANTED_CRIMINAL_TRANSPORT',
      isAlert: true,
      time: new Date(Date.now() - 120000).toLocaleTimeString()
    },
    {
      id: 3,
      plate: 'GJ-18-BS-3410',
      vehicle_type: 'BUS',
      rto: 'Gandhinagar',
      status: 'CLEAN',
      isAlert: false,
      time: new Date(Date.now() - 240000).toLocaleTimeString()
    }
  ]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Enumerate all available camera devices on phone/laptop
  const fetchCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn("Device enumeration note:", e);
    }
  };

  // Play synthetic HUD sound effects
  const playBeep = (isAlert = false) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (isAlert) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  };

  // Start mobile / web camera feed with selected facing mode (environment = back, user = front)
  const startBrowserCamera = async (overrideFacing = null, overrideDeviceId = null) => {
    setStreamError(null);
    const activeFacing = overrideFacing || facingMode;
    const activeDevice = overrideDeviceId !== null ? overrideDeviceId : selectedDeviceId;

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }

      const videoConstraints = activeDevice
        ? { deviceId: { exact: activeDevice }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: { ideal: activeFacing }, width: { ideal: 1280 }, height: { ideal: 720 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      mediaStreamRef.current = stream;

      // Check if phone torch / flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        setTorchSupported(!!caps.torch);
      } else {
        setTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play error:", e));
      }
      setCameraActive(true);
      fetchCameraDevices();
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback: try standard camera request without strict facing constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch (fallbackErr) {
        setStreamError("Could not access camera. Please allow camera permissions in browser.");
        setUseBrowserCam(false);
      }
    }
  };

  // Stop local browser camera
  const stopBrowserCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchActive(false);
  };

  // Toggle Flip Camera (Phone Back Camera vs Front Camera)
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    if (cameraActive && useBrowserCam) {
      startBrowserCamera(nextFacing, '');
    }
  };

  // Toggle Torch / Flashlight on mobile device
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !torchActive;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchActive(nextState);
      } catch (e) {
        console.warn("Torch constraint error:", e);
      }
    }
  };

  useEffect(() => {
    if (useBrowserCam && cameraActive) {
      startBrowserCamera();
    } else {
      stopBrowserCamera();
    }
    return () => {
      stopBrowserCamera();
    };
  }, [useBrowserCam]);

  // Trigger snapshot and send to AI backend for OCR & watchlist matching
  const handleCaptureAndScan = async (manualPlate = null, imageOverride = null) => {
    setIsScanning(true);
    try {
      let payload = {
        camera_id: facingMode === 'environment' ? 'MOBILE-BACK-CAM' : 'MOBILE-FRONT-CAM',
        location: 'Mobile & Web ANPR Field Unit'
      };
      
      if (manualPlate) {
        payload.manual_plate = manualPlate;
      } else if (imageOverride) {
        payload.image = imageOverride;
      } else if (useBrowserCam && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        payload.image = dataUrl;
        setUploadedPreview(dataUrl);
      } else {
        payload.manual_plate = 'GJ-01-BK-5268';
      }

      const res = await surveillanceService.scanFrame(payload);
      if (res.data && res.data.status === 'success') {
        const data = res.data;
        if (data.plate_number && data.plate_number !== 'NO_PLATE_DETECTED') {
          setCurrentResult(data);
          playBeep(data.is_alert);

          const newEntry = {
            id: Date.now(),
            plate: data.formatted_plate || data.plate_number,
            vehicle_type: data.vehicle_type || 'CAR',
            rto: data.rto_district,
            status: data.is_alert ? (data.watchlist_data?.status || 'RED_ALERT') : 'CLEAN',
            isAlert: data.is_alert,
            time: new Date().toLocaleTimeString()
          };
          setScanHistory(prev => [newEntry, ...prev.filter(p => p.plate !== newEntry.plate).slice(0, 8)]);
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle image/photo file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setUploadedPreview(dataUrl);
        handleCaptureAndScan(null, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper for Vehicle Type badge styling
  const getVehicleBadgeStyle = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('BIKE') || t.includes('CYCLE')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (t.includes('AUTO')) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (t.includes('BUS')) return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    if (t.includes('TRUCK')) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  };

  const getVehicleIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('BIKE') || t.includes('CYCLE')) return <Bike className="w-4 h-4 text-emerald-400" />;
    if (t.includes('AUTO')) return <Radio className="w-4 h-4 text-amber-400" />;
    if (t.includes('BUS')) return <Bus className="w-4 h-4 text-purple-400" />;
    if (t.includes('TRUCK')) return <Truck className="w-4 h-4 text-rose-400" />;
    return <Car className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <Smartphone className="w-5 h-5 animate-pulse text-cyan-300" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-mono tracking-wide flex items-center gap-2">
                14. Mobile & Web Camera ANPR Scanner
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  PHONE BACK CAMERA READY
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Use smartphone back camera, laptop webcam, or upload photos to scan vehicle number plates in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          
          {/* Flip / Switch Camera Button (Front / Back) */}
          <button
            onClick={toggleCameraFacing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition shadow-sm font-bold"
            title="Switch between Phone Back Camera and Front Selfie Camera"
          >
            <SwitchCamera className="w-4 h-4 text-cyan-400" />
            <span>{facingMode === 'environment' ? '📷 Back Camera (Rear)' : '🤳 Front Camera (Selfie)'}</span>
          </button>

          {/* Flashlight / Torch for Mobile (if supported) */}
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${
                torchActive 
                  ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/30' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Phone Flashlight"
            >
              <Sun className="w-4 h-4" />
              <span>{torchActive ? 'Flash ON' : 'Flash OFF'}</span>
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition ${
              soundEnabled 
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/30 hover:bg-slate-700' 
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title="Toggle Scan Sound FX"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Camera ON / OFF Toggle */}
          {cameraActive ? (
            <button
              onClick={() => {
                stopBrowserCamera();
                surveillanceService.stopCamera();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl font-bold transition shadow-lg shadow-rose-600/10"
            >
              <CameraOff className="w-4 h-4" />
              <span>Turn OFF</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (useBrowserCam) startBrowserCamera();
                else surveillanceService.startCamera("0");
                setCameraActive(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/20"
            >
              <Camera className="w-4 h-4" />
              <span>Turn ON</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Video Viewfinder + Live Recognition HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Video Camera Feed with Cyber Reticle */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl aspect-video flex items-center justify-center group">
            
            {/* Camera View */}
            {cameraActive ? (
              useBrowserCam ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  /* IMPORTANT: Only mirror front selfie camera; DO NOT mirror phone back camera so plate text is readable! */
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : 'scale-x-100'}`}
                />
              ) : (
                <img
                  src={`${API_BASE_URL}/api/video_feed?cam_id=webcam&t=${Date.now()}`}
                  alt="Camera Stream"
                  className="w-full h-full object-cover"
                  onError={() => setStreamError("Cannot connect to backend stream. Switch to Mobile / Browser mode.")}
                />
              )
            ) : (
              <div className="text-center p-8 space-y-3">
                <CameraOff className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <p className="text-slate-400 font-mono text-sm font-semibold">Camera is Currently Off</p>
                <button
                  onClick={() => {
                    startBrowserCamera();
                    setCameraActive(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold transition"
                >
                  Activate Phone / Web Camera
                </button>
              </div>
            )}

            {/* Tactical Live HUD Overlay */}
            {cameraActive && (
              <>
                {/* Top Status Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/30 text-xs font-mono text-blue-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{facingMode === 'environment' ? '📱 REAR / BACK SENSOR' : '🤳 FRONT SENSOR'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-mono text-cyan-300">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>OCR ANPR ACTIVE</span>
                  </div>
                </div>

                {/* Laser Scanning Reticle */}
                <div className="absolute inset-x-8 sm:inset-x-12 inset-y-8 sm:inset-y-10 border-2 border-dashed border-cyan-500/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                  </div>

                  {/* Center Target Box */}
                  <div className="relative mx-auto w-11/12 sm:w-4/5 h-28 border-2 border-emerald-400/80 bg-emerald-500/5 rounded-xl flex flex-col items-center justify-center text-center p-2 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-pulse" />
                    <Scan className="w-6 h-6 text-emerald-300 animate-bounce mb-1" />
                    <span className="text-[11px] font-mono font-bold text-emerald-300 tracking-wider">
                      POINT REAR CAMERA AT VEHICLE NUMBER PLATE
                    </span>
                    <span className="text-[9px] font-mono text-slate-300">
                      Auto-extracts plate text and checks eGujCop & VAHAN databases
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                </div>

                {/* Manual Trigger & Flip Button on Bottom Bar */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 px-4">
                  <button
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-full bg-black/70 hover:bg-black text-cyan-300 border border-cyan-500/40 backdrop-blur-md transition active:scale-95 shadow-lg"
                    title="Flip Camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCaptureAndScan()}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono font-bold text-xs rounded-full shadow-2xl shadow-cyan-500/30 transition transform active:scale-95 disabled:opacity-50"
                  >
                    <Zap className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'READING OCR TEXT...' : 'CAPTURE & SCAN NOW'}</span>
                  </button>
                </div>
              </>
            )}

            {streamError && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <p className="text-slate-300 font-mono text-xs">{streamError}</p>
                <button
                  onClick={() => startBrowserCamera()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold"
                >
                  Retry Camera Permission
                </button>
              </div>
            )}
          </div>

          {/* Quick 1-Click Test Plate Buttons & Custom Scan Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-CLICK TEST SCENARIOS (ALL VEHICLES: CAR, BIKE, AUTO, BUS, TRUCK)
              </span>
              <span className="text-[10px] font-mono text-slate-500">VAHAN 4.0 Live</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_TEST_PLATES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCaptureAndScan(item.plate)}
                  className={`p-2 rounded-xl text-left border font-mono transition text-xs flex flex-col justify-between ${
                    item.type === 'danger'
                      ? 'bg-rose-950/25 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
                      : item.type === 'warning'
                      ? 'bg-amber-950/25 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                      : 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs tracking-wider">{item.plate}</span>
                    <span className="text-[9px] font-bold opacity-75">{item.category}</span>
                  </div>
                  <span className="text-[9px] opacity-80 truncate mt-1">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Input Scanner & Photo Upload */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                value={customPlateInput}
                onChange={(e) => setCustomPlateInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPlateInput.trim()) {
                    handleCaptureAndScan(customPlateInput.trim());
                  }
                }}
                placeholder="Enter any number plate (e.g. GJ01BK5268, GJ05KY1290)..."
                className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  if (customPlateInput.trim()) {
                    handleCaptureAndScan(customPlateInput.trim());
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" /> Scan Text
              </button>
              
              <label className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Photo / Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Recognition Results & Hotlist Alerts */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Recognition Result Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Live Plate Recognition Result
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                ANPR OCR ENGINE
              </span>
            </div>

            {currentResult && currentResult.plate_number && currentResult.plate_number !== 'NO_PLATE_DETECTED' ? (
              <div className="space-y-4">
                
                {/* Visual Thumbnail Preview if Photo Uploaded */}
                {uploadedPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-36 flex items-center justify-center">
                    <img 
                      src={uploadedPreview} 
                      alt="Scanned Source" 
                      className="w-full h-36 object-contain"
                    />
                    <div className="absolute bottom-1.5 right-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                      <Check className="w-2.5 h-2.5" /> OCR SCANNED
                    </div>
                  </div>
                )}

                {/* Formatted Number Plate Badge */}
                <div className={`p-4 rounded-2xl border-2 text-center transition ${
                  currentResult.is_alert 
                    ? 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-900/30 animate-pulse' 
                    : 'bg-slate-950 border-emerald-500/60 shadow-xl shadow-emerald-950/20'
                }`}>
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      {currentResult.state || 'GUJARAT'} STATE RTO
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase flex items-center gap-1 ${getVehicleBadgeStyle(currentResult.vehicle_type)}`}>
                      {getVehicleIcon(currentResult.vehicle_type)}
                      {currentResult.vehicle_type || 'CAR'}
                    </span>
                  </div>

                  {/* Standardized Unified Number Plate Display */}
                  <div className={`text-2xl sm:text-3xl font-black font-mono tracking-widest my-1 ${
                    currentResult.is_alert ? 'text-rose-400' : 'text-cyan-300'
                  }`}>
                    {currentResult.formatted_plate || currentResult.plate_number}
                  </div>

                  {/* OCR Details */}
                  <div className="text-xs font-mono text-slate-300 mt-2 flex flex-col gap-1 border-t border-slate-800/80 pt-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">RTO Jurisdiction:</span>
                      <strong className="text-white">{currentResult.rto_district}</strong>
                    </div>
                    {currentResult.raw_text && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">OCR Extracted Text:</span>
                        <code className="text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">{currentResult.raw_text}</code>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Confidence Score:</span>
                      <span className="text-cyan-400 font-bold">{Math.round((currentResult.confidence || 0.95) * 100)}% Match</span>
                    </div>
                  </div>
                </div>

                {/* Alert Status Banner */}
                {currentResult.is_alert ? (
                  <div className="p-3.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 space-y-2">
                    <div className="flex items-center gap-2 font-mono font-bold text-xs text-red-200">
                      <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce shrink-0" />
                      <span>🚨 CRITICAL eGujCop RED ALERT MATCH!</span>
                    </div>
                    <div className="text-xs font-mono space-y-1 bg-black/40 p-2.5 rounded-lg border border-red-500/20">
                      <p><strong className="text-red-400">FIR Number:</strong> {currentResult.watchlist_data?.fir_number || 'FIR/2026/AHM/4092'}</p>
                      <p><strong className="text-red-400">Offense:</strong> {currentResult.watchlist_data?.crime_category || 'Stolen Vehicle / Hotlisted'}</p>
                      <p><strong className="text-red-400">Police Station:</strong> {currentResult.watchlist_data?.police_station || 'Gujarat Police Cyber Grid'}</p>
                      <p><strong className="text-red-400">Action:</strong> {currentResult.watchlist_data?.action_required || 'Dispatch PCR Patrol Vector'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>VAHAN 4.0 Verification: Clean record, valid registration & no pending warrants.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">
                <Eye className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                <p className="text-slate-400 font-mono text-xs">
                  No plate detected in current frame. Point rear camera at number plate, upload a photo, or click test buttons above.
                </p>
              </div>
            )}
          </div>

          {/* Recent Scans Session Log */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                SESSION SCAN AUDIT LOG
              </span>
              <span className="text-[10px] font-mono text-slate-500">{scanHistory.length} Scans</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {scanHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
                    item.isAlert
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-black tracking-wider text-white flex items-center gap-2">
                      <span className="text-cyan-300">{item.plate}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${getVehicleBadgeStyle(item.vehicle_type)}`}>
                        {item.vehicle_type || 'CAR'}
                      </span>
                      {item.isAlert && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                          HOTLIST
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.rto}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
