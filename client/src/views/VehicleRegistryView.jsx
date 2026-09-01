import React from 'react';
import { Car, Shield, CheckCircle2 } from 'lucide-react';

export const SAMPLE_CARS = [
  { plate: "GJ01AB1234", name: "Hyundai Creta", color: "White", owner: "Rajesh Patel", rto: "Ahmedabad RTO (GJ-01)", status: "STOLEN / WANTED", type: "SUV" },
  { plate: "GJ05CD5678", name: "Maruti Swift", color: "Silver", owner: "Amit Shah", rto: "Surat RTO (GJ-05)", status: "SUSPICIOUS / WATCHLIST", type: "Hatchback" },
  { plate: "GJ03EF9012", name: "Toyota Fortuner", color: "Black", owner: "Vikram Jadeja", rto: "Rajkot RTO (GJ-03)", status: "ACTIVE SURVEILLANCE", type: "SUV" },
  { plate: "GJ06GH3456", name: "Tata Nexon", color: "Blue", owner: "Bhavin Desai", rto: "Vadodara RTO (GJ-06)", status: "CHALAN OVERDUE", type: "Compact SUV" },
  { plate: "GJ18JK7890", name: "Mahindra Scorpio", color: "White", owner: "Kiran Vaghela", rto: "Gandhinagar RTO (GJ-18)", status: "CLEAR", type: "SUV" },
];

export default function VehicleRegistryView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-400" /> Vehicle Model & RTO Registration Master Registry
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Detailed vehicle taxonomy, owner records and VAHAN 4.0 integration profiles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_CARS.map((car, i) => (
          <div key={i} className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 hover:border-blue-500/40 transition">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-sm font-extrabold text-blue-400 font-mono tracking-wider bg-blue-600/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                {car.plate}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                car.status.includes('STOLEN') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {car.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-500">MODEL:</span><span className="text-white font-bold">{car.name} ({car.color})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">OWNER:</span><span className="text-slate-300">{car.owner}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">RTO JURISDICTION:</span><span className="text-cyan-400">{car.rto}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
