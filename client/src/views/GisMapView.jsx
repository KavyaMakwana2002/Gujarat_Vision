import React, { useEffect, useRef } from 'react';
import { Map, Shield, Radio, MapPin } from 'lucide-react';

export const GUJARAT_POSTS = [
  { name: "Ahmedabad Command Centre & SG Highway Post", lat: 23.0225, lng: 72.5714, feeds: "12,500 Feeds" },
  { name: "Surat Ring Road & Dumas Checkpost", lat: 21.1702, lng: 72.8311, feeds: "11,000 Feeds" },
  { name: "Dwarka Temple & Coastal Surveillance Node", lat: 22.2442, lng: 68.9685, feeds: "4,800 Feeds" },
  { name: "Mehsana Highway & Modhera Circle Node", lat: 23.5880, lng: 72.3693, feeds: "4,200 Feeds" },
  { name: "Vadodara Urban Command Grid", lat: 22.3072, lng: 73.1812, feeds: "7,500 Feeds" },
  { name: "Rajkot Saurashtra Junction Node", lat: 22.3039, lng: 70.8022, feeds: "6,800 Feeds" },
  { name: "Bhuj & Kutch Border Surveillance Hub", lat: 23.2420, lng: 69.6669, feeds: "6,200 Feeds" },
  { name: "Gandhinagar Capital Security Grid", lat: 23.2156, lng: 72.6369, feeds: "5,200 Feeds" },
];

export default function GisMapView() {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && mapContainerRef.current) {
      // Clear if previously initialized
      const container = mapContainerRef.current;
      container.innerHTML = "<div id='leaflet-map' style='width: 100%; height: 100%;'></div>";

      const map = window.L.map('leaflet-map').setView([22.8, 71.2], 7);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; Gujarat Cyber Vision GIS'
      }).addTo(map);

      GUJARAT_POSTS.forEach((p) => {
        window.L.marker([p.lat, p.lng])
          .addTo(map)
          .bindPopup(`<b>${p.name}</b><br/>${p.feeds} Active`);
      });
    }
  }, []);

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" /> Gujarat State GIS Traffic & Crime Surveillance Map
          </h2>
          <p className="text-xs text-slate-400 font-mono">Live GPS GIS matrix linking 80,000 CCTV nodes across Gujarat</p>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold">
          8 POLICE HQ HUBS ACTIVE
        </span>
      </div>

      <div 
        ref={mapContainerRef} 
        className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl relative"
      >
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
          <MapPin className="w-8 h-8 text-blue-400 animate-bounce mb-2" />
          <span>Loading Gujarat Police GIS Mapping Layer...</span>
        </div>
      </div>
    </div>
  );
}
