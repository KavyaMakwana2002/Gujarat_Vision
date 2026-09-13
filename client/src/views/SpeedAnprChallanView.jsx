import React, { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { Zap, Mail, ShieldAlert, Car, AlertTriangle, CheckCircle, Radio, Upload } from 'lucide-react';
import { API_BASE_URL, surveillanceService } from '../services/api';

export default function SpeedAnprChallanView({ activeCamera }) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedCamId, setUploadedCamId] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const response = await surveillanceService.uploadVideo(file);
      if (response.data.cam_id) {
        setUploadedCamId(response.data.cam_id);
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
    setUploading(false);
  };

  const speedStreamUrl = uploadedCamId
    ? `${API_BASE_URL}/api/speed_feed?cam_id=${encodeURIComponent(uploadedCamId)}&city=${encodeURIComponent(activeCamera?.city || 'Ahmedabad')}`
    : `${API_BASE_URL}/api/speed_feed?cam_id=${encodeURIComponent('c:/Users/KAVYA/OneDrive/Desktop/Gujarat_Cyber_Vision/Indian_Traffic,_Vehicles,_Highway_Footage_for_Object_Detection(2160p).webm')}&city=${encodeURIComponent(activeCamera?.city || 'Ahmedabad')}`;

  const fetchViolations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/speed_violations`);
      if (res.ok) {
        const data = await res.json();
        setViolations(data.violations || []);
      }
    } catch (e) {
      console.warn("Failed to fetch speed violations");
    }
  };

  useEffect(() => {
    fetchViolations();
    const iv = setInterval(fetchViolations, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleSendManualChallan = async (v) => {
    setLoading(true);
    try {
      const payload = {
        plate_number: v.plate_number,
        speed: v.speed,
        location: v.location,
        vehicle_type: v.vehicle_type,
        timestamp: v.timestamp
      };

      const res = await fetch(`${API_BASE_URL}/api/challan/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setToastMsg(`E-Challan Dispatched to ${v.plate_number}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      setToastMsg("Failed to dispatch E-Challan");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setLoading(false);
  };

  const handleTestLiveChallan = async () => {
    setLoading(true);
    try {
      // Generate realistic Gujarat Number Plate (e.g., GJ-01-AB-1234)
      const rtoCodes = ['01', '02', '03', '04', '05', '06', '27', '38'];
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomRto = rtoCodes[Math.floor(Math.random() * rtoCodes.length)];
      const randomLetters = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
      const randomDigits = Math.floor(Math.random() * 9000 + 1000).toString(); // 1000 to 9999
      const realisticPlate = `GJ-${randomRto}-${randomLetters}-${randomDigits}`;

      const payload = {
        plate_number: realisticPlate,
        speed: Math.floor(Math.random() * 50) + 70, // 70 to 120 km/h
        location: "Test Simulator Highway",
        vehicle_type: "CAR",
        timestamp: new Date().toISOString()
      };
      
      const res = await fetch(`${API_BASE_URL}/api/challan/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setToastMsg(`TEST: E-Challan Email Sent for ${payload.plate_number}! Check Server Logs.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (e) {
      setToastMsg("Failed to dispatch Test E-Challan");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between premium-glass p-5 rounded-2xl border border-slate-700/50 shadow-xl">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-wider flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            SPEED & ANPR INTERCEPTOR GRID
          </h1>
          <p className="text-sm text-slate-400 mt-1">Live Speed Estimation & Automated E-Challan Mailing System</p>
        </div>
        <div className="flex gap-4 items-center">
          <label className="cursor-pointer bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg">
            <Upload className="w-4 h-4" /> {uploading ? "..." : "Upload Video"}
            <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <button 
            onClick={handleTestLiveChallan}
            disabled={loading}
            className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10"
            title="Simulate a violation and send a real email"
          >
            <Mail className="w-4 h-4" /> TEST LIVE EMAIL
          </button>
          <div className="bg-slate-900/60 border border-slate-700/50 px-4 py-2 rounded-xl text-center">
            <span className="block text-xs text-slate-400 font-mono">Speed Limit</span>
            <span className="block font-bold text-yellow-400">60 KM/H</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/50 px-4 py-2 rounded-xl text-center">
            <span className="block text-xs text-slate-400 font-mono">Violations Logged</span>
            <span className="block font-bold text-red-400">{violations.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Live Stream Player */}
        <div className="lg:col-span-2 relative h-[500px] lg:h-auto rounded-2xl border border-slate-700/60 bg-black overflow-hidden shadow-2xl flex flex-col">
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur border border-slate-700 rounded-lg flex items-center gap-2 text-xs font-mono">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-slate-200">LIVE FEED</span>
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <img
              src={speedStreamUrl}
              alt="Live Feed"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/1280x720/0f172a/334155?text=CAMERA+OFFLINE";
              }}
            />
          </div>
        </div>

        {/* Violations Log Panel */}
        <div className="premium-glass rounded-2xl border border-slate-700/50 p-5 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-sm font-bold text-white font-mono tracking-widest flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-4">
            <ShieldAlert className="w-4 h-4 text-red-400" /> RECENT VIOLATORS
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {violations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500/50 opacity-60">
                <AlertTriangle className="w-12 h-12 mb-3" />
                <p className="font-mono text-sm">Monitoring Network...</p>
              </div>
            ) : (
              violations.map((v, i) => (
                <div key={v.id} className="bg-slate-900/60 border border-red-500/20 hover:border-red-500/50 transition-colors p-4 rounded-xl flex flex-col gap-3 group shadow-inner">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Car className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 tracking-wider font-mono text-sm">{v.plate_number}</div>
                        <div className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-400 font-mono">{v.speed} km/h</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{v.vehicle_type}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendManualChallan(v)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all hover:text-white border border-slate-600/50"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    RESEND E-CHALLAN
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce-short">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-mono text-sm font-bold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
