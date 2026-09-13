import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Plus, Siren, FileText, X, MapPin, Navigation } from 'lucide-react';

function TrajectoryMapModal({ car, onClose }) {
  const mapRef = useRef(null);
  
  useEffect(() => {
    let mapInstance = null;
    let timeoutId;
    
    import('leaflet').then((module) => {
      const L = module.default || module;
      if (!mapRef.current) return;
      
      // Wait for modal animation to finish before initializing map
      timeoutId = setTimeout(() => {
        if (!mapRef.current) return;
        
        // Cleanup previous map if any
        if (mapRef.current._leaflet_id) {
          mapRef.current.innerHTML = '';
          mapRef.current._leaflet_id = null;
        }
        
        mapInstance = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([23.0225, 72.5714], 9);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance);
        
        // Define points
        const p1 = [23.0225, 72.5714]; // Ahmedabad
        const p2 = [23.2156, 72.6369]; // Gandhinagar (Last Seen)
        const p3 = [23.5880, 72.3260]; // Mehsana (Estimated Destination)
        const p4 = [24.1750, 72.4260]; // Banaskantha (Border)
        
        // Draw path
        const path = [p1, p2, p3, p4];
        
        const polyline = L.polyline(path, {
          color: '#ef4444',
          weight: 4,
          dashArray: '10, 10',
          opacity: 0.8
        }).addTo(mapInstance);
        
        // Markers
        const createIcon = (color) => L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px ${color}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        
        L.marker(p1, { icon: createIcon('#3b82f6') }).bindTooltip('Reported: ' + car.ps).addTo(mapInstance);
        L.marker(p2, { icon: createIcon('#eab308') }).bindTooltip('Last Seen: Gandhinagar').addTo(mapInstance);
        L.marker(p4, { icon: createIcon('#ef4444') }).bindTooltip('Predicted Exit: State Border').addTo(mapInstance);
        
        mapInstance.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        
        setTimeout(() => mapInstance.invalidateSize(), 100);
      }, 400); // 400ms delay to let the fade-in animation complete
    });
    
    return () => {
      clearTimeout(timeoutId);
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [car]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-black/80 relative">
        <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">AI Trajectory Estimation</h3>
              <p className="text-slate-400 text-xs font-mono">{car.car} - {car.plate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 relative w-full h-full">
          {/* Map Container */}
          <div ref={mapRef} className="absolute inset-0 z-0" style={{ backgroundColor: '#1e293b' }}></div>
          
          {/* Info Panel Overlay */}
          <div className="absolute top-4 right-4 w-72 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-xl z-10">
            <h4 className="text-red-400 font-bold text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Tracking Status: ACTIVE
            </h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold text-blue-400">1. Origin / Reported</p>
                <p className="text-white text-sm font-semibold">{car.ps}</p>
                <p className="text-slate-500 text-xs">Date: {car.date}</p>
              </div>
              
              <div className="border-l-2 border-dashed border-slate-700 pl-3 ml-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold text-yellow-500">2. Last ANPR Sighting</p>
                <p className="text-white text-sm font-semibold">Gandhinagar Toll Plaza</p>
                <p className="text-slate-500 text-xs">Time: -2 hrs ago</p>
              </div>
              
              <div className="border-l-2 border-dashed border-slate-700 pl-3 ml-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold text-red-500">3. Estimated Destination</p>
                <p className="text-white text-sm font-semibold">Banaskantha Border / Rajasthan</p>
                <p className="text-slate-500 text-xs">Confidence: 89% (AI Predicted)</p>
              </div>
            </div>
            
            <button className="w-full mt-5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg py-2 text-xs font-bold transition">
              Dispatch Highway Patrol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StolenRegistryView() {
  const [selectedCar, setSelectedCar] = useState(null);

  const stolen = [
    { plate: "GJ01XX9999", fir: "FIR/2026/AHM/1234", car: "Hyundai Creta (White)", owner: "Rahul Sharma", date: "28 Aug 2026", ps: "Satellite Police Station" },
    { plate: "GJ05YY8888", fir: "FIR/2026/SUR/5678", car: "Kia Seltos (Black)", owner: "Pooja Varma", date: "30 Aug 2026", ps: "Varachha Police Station" },
    { plate: "GJ03ZZ7777", fir: "FIR/2026/RAJ/9012", car: "Toyota Innova (Silver)", owner: "Sanjay Patel", date: "31 Aug 2026", ps: "Bhakti Nagar PS" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Gujarat Police Stolen Vehicle Crime Registry
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active FIR records synced in real-time with eGujCop & VAHAN 4.0 database
          </p>
        </div>
        <button 
          onClick={() => window.open('https://gujhome.gujarat.gov.in/', '_blank')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
        >
          <Plus className="w-4 h-4" /> Register New Stolen Car
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stolen.map((s, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedCar(s)}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-blue-500/40 hover:bg-blue-900/10 transition cursor-pointer group shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-extrabold text-red-400 font-mono tracking-wider bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 group-hover:bg-red-500/20 transition">
                {s.plate}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                {s.fir}
              </span>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <h4 className="font-bold text-white font-sans text-sm group-hover:text-blue-400 transition">{s.car}</h4>
              <p className="text-slate-400">Owner: <span className="text-slate-200">{s.owner}</span></p>
              <p className="text-slate-400">Station: <span className="text-cyan-400">{s.ps}</span></p>
              <p className="text-[10px] text-slate-500 mt-2">Reported: {s.date}</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center text-[10px] text-blue-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
              <Navigation className="w-3 h-3 mr-1" /> View Tracking Trajectory
            </div>
          </div>
        ))}
      </div>

      {selectedCar && (
        <TrajectoryMapModal car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </div>
  );
}