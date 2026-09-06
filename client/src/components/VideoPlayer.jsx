import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Square, 
  RefreshCw, 
  Shield, 
  ExternalLink, 
  Loader2,
  Download,
  Check
} from 'lucide-react';
import { surveillanceService, API_BASE_URL } from '../services/api';

export default function VideoPlayer({ streamUrl, title = "Live Surveillance Feed", badge = "AI ANPR ACTIVE" }) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [camActionLoading, setCamActionLoading] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const imgRef = useRef(null);

  // Extract cam_id from streamUrl safely
  const getCamId = useCallback(() => {
    try {
      const url = new URL(streamUrl, window.location.origin);
      return (url.searchParams.get('cam_id') || 'cam01').toLowerCase();
    } catch {
      return 'cam01';
    }
  }, [streamUrl]);

  const camId = getCamId();
  const activeFeedUrl = `${API_BASE_URL}/api/video_feed?cam_id=${camId}&t=${streamKey}`;

  // Reset stream loading on camera change
  useEffect(() => {
    setIsStreaming(true);
    setStreamKey(Date.now());
    const timer = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(timer);
  }, [streamUrl]);

  // ─── Action Handlers ────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setStreamKey(Date.now());
  };

  const handleTakeSnapshot = () => {
    if (!imgRef.current) return;
    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Add Official Police Watermark
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`GUJARAT POLICE SURVEILLANCE • EVIDENCE SNAPSHOT [${camId.toUpperCase()}] • ${new Date().toLocaleString()}`, 20, canvas.height - 20);

      const link = document.createElement('a');
      link.download = `Gujarat_Police_Evidence_${camId.toUpperCase()}_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      
      setSnapshotSaved(true);
      setTimeout(() => setSnapshotSaved(false), 2500);
    } catch (err) {
      console.warn('Snapshot capture notice:', err);
    }
  };

  const handleStartCamera = async () => {
    setCamActionLoading(true);
    try {
      await surveillanceService.startCamera(camId);
    } catch (err) {
      console.warn('startCamera warning:', err);
    } finally {
      setIsStreaming(true);
      setCamActionLoading(false);
      handleRefresh();
    }
  };

  const handleStopCamera = async () => {
    setCamActionLoading(true);
    try {
      await surveillanceService.stopCamera();
    } catch (err) {
      console.warn('stopCamera warning:', err);
    } finally {
      setIsStreaming(false);
      setCamActionLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {isStreaming ? (
            <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <CameraOff className="w-4 h-4 text-slate-500" />
          )}
          <span className="font-bold text-white font-mono truncate max-w-[280px]">{title}</span>

          {isStreaming ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold shrink-0">
              STANDBY
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] shrink-0">
          {isStreaming ? (
            <>
              <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                TCP: LOCKED
              </span>

              <button
                onClick={handleTakeSnapshot}
                className="p-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 transition border border-cyan-700/50 flex items-center gap-1 font-bold text-[10px]"
                title="Capture & Download Live Evidence Snapshot"
              >
                {snapshotSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{snapshotSaved ? 'SAVED!' : 'SNAPSHOT'}</span>
              </button>

              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                title="Refresh Stream Feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`rtsp://103.250.160.189:8554/stream/${camId}`);
                  alert(`RTSP Stream URL copied to clipboard:\nrtsp://103.250.160.189:8554/stream/${camId}\n\n(Use this URL in VLC Media Player or VMS Client)`);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition border border-slate-700 flex items-center gap-1 text-[10px]"
                title="Copy RTSP URL for VLC / VMS"
              >
                <span>RTSP</span>
              </button>

              <a
                href={activeFeedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center gap-1"
                title="Open Live AI Web Stream in New Window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleStopCamera}
                disabled={camActionLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                title="Turn off camera feed"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Turn Off</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStartCamera}
              disabled={camActionLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              title="Turn on camera feed"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Turn On Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Video Screen ── */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
        {isStreaming ? (
          <>
            {/* Live AI MJPEG Stream */}
            <img
              ref={imgRef}
              crossOrigin="anonymous"
              key={`feed-${camId}-${streamKey}`}
              src={activeFeedUrl}
              alt={title}
              className="w-full h-full object-cover"
              onLoad={() => setLoading(false)}
              onError={() => {
                setTimeout(() => {
                  setStreamKey(Date.now());
                }, 1000);
              }}
            />

            {/* Tactical Loading Indicator */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 pointer-events-none">
                <Loader2 className="w-9 h-9 text-cyan-400 animate-spin mb-2.5" />
                <span className="text-cyan-300 text-xs font-mono font-bold tracking-widest animate-pulse">
                  CONNECTING TO {camId.toUpperCase()} SURVEILLANCE FEED...
                </span>
              </div>
            )}

            {/* Tactical Police HUD Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 pointer-events-none">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>GUJARAT POLICE SENTINEL • {camId.toUpperCase()} LIVE AI FEED</span>
            </div>
          </>
        ) : (
          /* Standby Tactical Screen */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3.5 text-slate-400">
              <CameraOff className="w-7 h-7 text-slate-400" />
            </div>

            <h3 className="text-white font-bold text-sm tracking-wide font-mono mb-1">
              CAMERA FEED IN STANDBY
            </h3>
            <p className="text-slate-400 text-xs max-w-sm mb-4 font-sans">
              Camera sensor is in standby mode. Click below to activate real-time surveillance feed.
            </p>

            <button
              onClick={handleStartCamera}
              disabled={camActionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition shadow-xl shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{camActionLoading ? "INITIALIZING HARDWARE..." : "START SURVEILLANCE CAMERA"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}