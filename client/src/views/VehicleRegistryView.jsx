import React, { useState } from 'react';
import { Car, Bike, Truck, Bus, Radio, Shield, Layers, Filter } from 'lucide-react';

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

export default function VehicleRegistryView() {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" /> Vehicle Model & RTO Registration Master Registry
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Detailed vehicle taxonomy across CAR, BIKE, AUTO, BUS, and TRUCK with VAHAN 4.0 integration
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['ALL', 'CAR', 'BIKE', 'AUTO', 'BUS', 'TRUCK'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((car, i) => (
          <div key={i} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-blue-500/40 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getCategoryIcon(car.category)}
                  </div>
                  <span className="text-sm font-black text-cyan-300 font-mono tracking-wider bg-blue-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    {car.plate}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  car.status.includes('STOLEN') || car.status.includes('WANTED')
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : car.status.includes('SURVEILLANCE') || car.status.includes('WATCHLIST')
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {car.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">CATEGORY:</span>
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
  );
}