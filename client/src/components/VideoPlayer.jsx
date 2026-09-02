import React, { useState } from 'react';
import { Camera, CameraOff, Play, Square, RefreshCw, Shield, AlertCircle, Radio } from 'lucide-react';
import { surveillanceService } from '../services/api';

export default function VideoPlayer({ streamUrl, title = "Live Surveillance Feed", badge = "AI ANPR ACTIVE" }) {
  const [isStreaming, setIsStreaming] = useState(true); // Auto-stream active camera
  const [key, setKey] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [streamError, setStreamError] = useState(false);

  // Extract cam_id from streamUrl if present
  const getCameraIdFromUrl = () => {
    try {
      const url = new URL(streamUrl, window.location.origin);
      return url.searchParams.get("cam_id") || "cam01";
    } catch {
      return "cam01";
    }
  };

  // Automatically activate stream whenever a new camera is selected
  useEffect(() => {
    setIsStreaming(true);
    setStreamError(false);
    setKey(Date.now());
  }, [streamUrl]);

  const handleStartCamera = async () => {
    setLoading(true);
    const targetCam = getCameraIdFromUrl();
    try {
      await surveillanceService.startCamera(targetCam);
    } catch (err) {
      console.warn("Could not reach backend startCamera endpoint:", err);
    } finally {
      setIsStreaming(true);
      setStreamError(false);
      setKey(Date.now());
      setLoading(false);
    }
  };

  const handleStopCamera = async () => {
    setLoading(true);
    try {
      await surveillanceService.stopCamera();
    } catch (err) {
      console.warn("Could not reach backend stopCamera endpoint:", err);
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setStreamError(false);
    setKey(Date.now());
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <CameraOff className="w-4 h-4 text-slate-500" />
          )}
          <span className="font-bold text-white font-mono">{title}</span>
          
          {isStreaming ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
              STANDBY
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          {isStreaming ? (
            <>
              <span className="text-emerald-400 text-[10px]">TCP: LOCKED</span>
              <button 
                onClick={handleRefresh}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Refresh stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleStopCamera}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition shadow-sm"
                title="Turn off camera hardware"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Turn Off Camera</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStartCamera}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-600/20"
              title="Turn on camera hardware"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Turn On Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Screen */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
        {isStreaming ? (
          <>
            <img
              key={key}
              src={streamUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => {
                setStreamError(true);
                setTimeout(() => {
                  setKey(Date.now());
                }, 2000);
              }}
            />

            {/* Scanlines & HUD */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>GUJARAT POLICE SENTINEL AI • LIVE FEED</span>
            </div>
          </>
        ) : (
          /* Standby Tactical Screen */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-slate-400 group-hover:border-emerald-500/40 transition">
              <CameraOff className="w-8 h-8 text-slate-400" />
            </div>

            <h3 className="text-white font-bold text-sm tracking-wide font-mono mb-1">
              CAMERA FEED IN STANDBY
            </h3>
            <p className="text-slate-400 text-xs max-w-sm mb-5 font-sans">
              Camera hardware is turned off. Click below to activate the camera sensor and begin real-time AI vehicle detection.
            </p>

            <button
              onClick={handleStartCamera}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition shadow-xl shadow-emerald-600/25 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? "INITIALIZING HARDWARE..." : "START SURVEILLANCE CAMERA"}</span>
            </button>

            <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Hardware Sensor: Offline (Privacy Mode Active)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
