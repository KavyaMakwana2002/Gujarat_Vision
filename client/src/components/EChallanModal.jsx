import React from 'react';
import { Shield, Printer, X, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';

export default function EChallanModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  const challanNo = `GJ-ECH-2026-${Math.abs(String(vehicle.id || vehicle.plate_number).split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0, 0)).toString().slice(0, 6)}`;
  const dateStr = vehicle.timestamp ? new Date(vehicle.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
  const timeStr = vehicle.timestamp ? new Date(vehicle.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>GUJARAT POLICE • OFFICIAL E-CHALLAN GENERATOR</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Notice Body */}
        <div className="p-8 space-y-6 font-mono print:p-0 print:text-black">
          
          {/* Header Banner */}
          <div className="text-center border-b border-slate-700 pb-4 print:border-black">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg print:border-black print:text-black">
                GJ
              </div>
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-wide uppercase print:text-black">
              Government of Gujarat • Police Department
            </h1>
            <p className="text-xs text-cyan-400 font-bold tracking-widest mt-0.5 print:text-black">
              SENTINEL AI TRAFFIC ENFORCEMENT & SURVEILLANCE CELL
            </p>
            <p className="text-[11px] text-slate-400 mt-1 print:text-gray-600">
              Automated Violation Notice issued under Section 133A of Motor Vehicles Act, 1988
            </p>
          </div>

          {/* Challan Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs print:bg-gray-100 print:border-gray-300 print:text-black">
            <div>
              <span className="text-slate-500 text-[10px] block print:text-gray-600">CHALLAN NO</span>
              <span className="font-bold text-cyan-300 print:text-black">{challanNo}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block print:text-gray-600">DATE & TIME</span>
              <span className="font-bold text-slate-200 print:text-black">{dateStr} {timeStr}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block print:text-gray-600">ENFORCEMENT NODE</span>
              <span className="font-bold text-slate-200 print:text-black">{vehicle.camera_id || 'CAM01'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block print:text-gray-600">PENALTY AMOUNT</span>
              <span className="font-extrabold text-emerald-400 print:text-black">₹1,000</span>
            </div>
          </div>

          {/* Vehicle & Offense Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800 print:bg-white print:border-gray-300">
              <h3 className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-slate-700 pb-1.5 print:text-black print:border-gray-300">
                Vehicle Telemetry
              </h3>
              <div className="space-y-1.5 text-slate-300 print:text-black">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Plate Number:</span>
                  <span className="font-bold text-cyan-400 text-sm print:text-black">{vehicle.plate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Vehicle Class:</span>
                  <span className="font-semibold uppercase">{vehicle.vehicle_type || 'MOTOR VEHICLE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Registration Authority:</span>
                  <span className="font-semibold">Gujarat RTO (VAHAN 4.0 Verified)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Location:</span>
                  <span className="font-semibold">{vehicle.location || 'Gujarat Sentinel Grid Post'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800 print:bg-white print:border-gray-300">
              <h3 className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-slate-700 pb-1.5 print:text-black print:border-gray-300">
                Offense & Legal Notice
              </h3>
              <div className="space-y-1.5 text-slate-300 print:text-black">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Violation:</span>
                  <span className="font-bold text-amber-400 print:text-black">Speed Limit / Sentinel Alert</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Section:</span>
                  <span className="font-semibold">Sec 183 / 177 M.V. Act</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Evidence Status:</span>
                  <span className="font-semibold text-emerald-400 print:text-black">HD CCTV Logged (ByteTrack ANPR)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Payment Status:</span>
                  <span className="font-bold text-rose-400 print:text-black">PENDING</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code & Payment Instructions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs print:bg-gray-50 print:border-gray-300 print:text-black">
            <div className="space-y-1">
              <h4 className="font-bold text-white print:text-black">Digital Gujarat Online Payment:</h4>
              <p className="text-slate-400 text-[11px] print:text-gray-600">
                Scan QR or visit <span className="text-cyan-400 font-bold print:text-black">echallan.gujarat.gov.in</span> within 15 days.
              </p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">
                Authenticity Hash: SHA256:{challanNo}-VALIDATED-EGUJCOP
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg flex items-center justify-center shrink-0">
              <QrCode className="w-16 h-16 text-black" />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 print:hidden">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
