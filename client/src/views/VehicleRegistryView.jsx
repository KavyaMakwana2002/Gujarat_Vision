import React, { useState } from 'react';
import { Car, Bike, Truck, Bus, Radio, Shield, Layers, Filter, Search, Database } from 'lucide-react';
import VehicleSearchView from './VehicleSearchView';

export const MASTER_VEHICLES = [
  { plate: "GJ-01-BK5268", name: "Hyundai Creta", color: "Polar White", owner: "Rajesh Patel", rto: "Ahmedabad City (GJ-01)", status: "STOLEN / WANTED", category: "CAR", type: "SUV" },
  { plate: "GJ-01-EB4004", name: "Hero Splendor Plus", color: "Black-Silver", owner: "Kishan Rawal", rto: "Ahmedabad (GJ-01)", status: "CLEAR", category: "BIKE", type: "Motorcycle" },
  { plate: "GJ-01-TT8921", name: "Bajaj Compact RE", color: "Yellow-Green", owner: "Salim Mansuri", rto: "Ahmedabad (GJ-01)", status: "PERMIT EXPIRED", category: "AUTO", type: "Auto-Rickshaw" },
  { plate: "GJ-18-BS3410", name: "Tata Starbus Ultra (GSRTC)", color: "Silver-Blue", owner: "Gujarat State Road Transport", rto: "Gandhinagar (GJ-18)", status: "CLEAR", category: "BUS", type: "Intercity Bus" },
  { plate: "GJ-11-TK7720", name: "Tata Signa 2823", color: "Orange-Brown", owner: "Sardar Logistics", rto: "Junagadh (GJ-11)", status: "ACTIVE SURVEILLANCE", category: "TRUCK", type: "Heavy Goods Vehicle" },
  { plate: "GJ-05-CD5678", name: "Maruti Swift VXi", color: "Silky Silver", owner: "Amit Shah", rto: "Surat (GJ-05)", status: "SUSPICIOUS / WATCHLIST", category: "CAR", type: "Hatchback" },
  { plate: "GJ-03-EF9012", name: "Toyota Fortuner 4x4", color: "Attitude Black", owner: "Vikram Jadeja", rto: "Rajkot (GJ-03)", status: "ACTIVE SURVEILLANCE", category: "CAR", type: "SUV" },
  { plate: "GJ-05-KY1290", name: "Honda Activa 6G", color: "Pearl White", owner: "Jignesh Mehta", rto: "Surat (GJ-05)", status: "CLEAR", category: "BIKE", type: "Scooter" },
  { plate: "GJ-06-TX1920", name: "Mahindra Alfa Auto", color: "Yellow", owner: "Dharmesh Soni", rto: "Vadodara (GJ-06)", status: "CLEAR", category: "AUTO", type: "Auto-Rickshaw" },
  { plate: "GJ-21-ST6541", name: "Ashok Leyland Viking (GSRTC)", color: "Blue Express", owner: "GSRTC Navsari Depot", rto: "Navsari (GJ-21)", status: "CLEAR", category: "BUS", type: "Passenger Express" },
  { plate: "GJ-12-LD9820", name: "Eicher Pro 3019", color: "Yellow Cabin", owner: "Kutch Cargo Liners", rto: "Kutch (GJ-12)", status: "WEIGHT OVERLOAD", category: "TRUCK", type: "Cargo Carrier" },
  { plate: "GJ-06-GH3456", name: "Tata Nexon EV", color: "Teal Blue", owner: "Bhavin Desai", rto: "Vadodara (GJ-06)", status: "CHALAN OVERDUE", category: "CAR", type: "Compact SUV" }
];

export default function VehicleRegistryView({ detections }) {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' or 'search'
  const [selectedCat, setSelectedCat] = useState('ALL');

  const filtered = MASTER_VEHICLES.filter(v => selectedCat === 'ALL' || v.category === selectedCat);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'BIKE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'AUTO': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'BUS': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'TRUCK': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'BIKE': return <Bike className="w-4 h-4 text-emerald-400" />;
      case 'AUTO': return <Radio className="w-4 h-4 text-amber-400" />;
      case 'BUS': return <Bus className="w-4 h-4 text-purple-400" />;
      case 'TRUCK': return <Truck className="w-4 h-4 text-rose-400" />;
      default: return <Car className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Tabs for Unified Hub */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-md mx-auto shadow-xl">
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'registry' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> RTO Master Registry
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            activeTab === 'search' 
              ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" /> Live ANPR Search
        </button>
      </div>

      {activeTab === 'registry' ? (
        <div className="space-y-6">
          {/* Top Header */}
          <div className="premium-glass p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 border border-cyan-400/30 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Car className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-3 tracking-wide drop-shadow-md">
              Vehicle Model & RTO Master Registry
              <span className="text-[10px] font-mono font-bold bg-blue-900/40 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-md flex items-center shadow-inner">
                VAHAN 4.0 Synced
              </span>
            </h2>
            <p className="text-xs text-slate-400/90 font-mono tracking-wide mt-1.5">
              Detailed vehicle taxonomy across CAR, BIKE, AUTO, BUS, and TRUCK with VAHAN 4.0 integration
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="relative z-10 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          {['ALL', 'CAR', 'BIKE', 'AUTO', 'BUS', 'TRUCK'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 shadow-inner ${
                selectedCat === cat
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/50 scale-105'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((car, i) => (
          <div key={i} className="premium-glass rounded-2xl border border-slate-700/50 p-5 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${
              car.status.includes('STOLEN') ? 'bg-red-500' : car.status.includes('WATCHLIST') ? 'bg-amber-500' : 'bg-cyan-500'
            }`} />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between border-b border-slate-700/50 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-700/60 shadow-inner group-hover:bg-slate-900 transition-colors">
                    {getCategoryIcon(car.category)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 mb-0.5 tracking-widest uppercase">LPR OCR Result</span>
                    <span className="text-sm font-black text-cyan-300 font-mono tracking-widest bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/40 shadow-inner">
                      {car.plate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-[11px] font-mono">
                <div className="flex justify-between items-center bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-500 font-bold tracking-wider">CATEGORY</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getCategoryBadge(car.category)}`}>
                    {car.category} ({car.type})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MODEL:</span>
                  <span className="text-white font-bold">{car.name} ({car.color})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OWNER:</span>
                  <span className="text-slate-300">{car.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RTO JURISDICTION:</span>
                  <span className="text-cyan-400">{car.rto}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
        </div>
      ) : (
        <VehicleSearchView detections={detections} />
      )}
    </div>
  );
}