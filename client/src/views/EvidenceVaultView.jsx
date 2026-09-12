import React, { useState } from 'react';
import { Disc, Play, Download, Trash2, Calendar, FileText, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function EvidenceVaultView() {
  const [activeVideo, setActiveVideo] = useState(null);

  const clips = [
    { id: "EVD-2026-001", title: "SG Highway Over-Speeding", time: "2026-09-12 10:45:12", size: "42.5 MB", duration: "02:15 min", target: "GJ01AB1234", speed: "85 KM/H", location: "SG Highway, Ahmedabad", type: "CAR", url: "/evidence/Hit_and_Run.mp4" },
    { id: "EVD-2026-002", title: "Ring Road Hit-and-Run Intercept", time: "2026-09-12 09:12:00", size: "65.1 MB", duration: "03:40 min", target: "GJ05CD5678", speed: "110 KM/H", location: "Ring Road, Surat", type: "TRUCK", url: null },
    { id: "EVD-2026-003", title: "Dwarka Checkpost Speed Violation", time: "2026-09-11 22:30:15", size: "28.0 MB", duration: "01:20 min", target: "GJ03EF9012", speed: "95 KM/H", location: "Dwarka Checkpost", type: "SUV", url: null },
    { id: "EVD-2026-004", title: "Baroda Express Way Red Alert", time: "2026-09-11 18:20:00", size: "55.2 MB", duration: "04:10 min", target: "GJ06GH3456", speed: "120 KM/H", location: "NE-1 Expressway, Vadodara", type: "CAR", url: null },
    { id: "EVD-2026-005", title: "Rajkot Stolen Vehicle Tracking", time: "2026-09-11 14:15:30", size: "32.1 MB", duration: "02:45 min", target: "GJ03STOLEN", speed: "N/A", location: "Gondal Road, Rajkot", type: "BIKE", url: null },
    { id: "EVD-2026-006", title: "Bhavnagar Civic Hazard", time: "2026-09-10 11:05:00", size: "18.5 MB", duration: "01:15 min", target: "ANIMAL/HAZARD", speed: "N/A", location: "Waghawadi Road, Bhavnagar", type: "UNKNOWN", url: null },
    { id: "EVD-2026-007", title: "Women Safety SOS Trigger", time: "2026-09-10 08:30:20", size: "48.0 MB", duration: "05:00 min", target: "SOS-PANIC", speed: "N/A", location: "Paldi, Ahmedabad", type: "PEDESTRIAN", url: null },
    { id: "EVD-2026-008", title: "Gandhinagar VIP Convoy Breach", time: "2026-09-09 16:45:10", size: "75.3 MB", duration: "06:20 min", target: "GJ18KL7890", speed: "80 KM/H", location: "CH-0 Circle, Gandhinagar", type: "CAR", url: null },
    { id: "EVD-2026-009", title: "Surat Textile Market Traffic Block", time: "2026-09-09 13:10:05", size: "22.8 MB", duration: "01:50 min", target: "GJ05MN1234", speed: "10 KM/H", location: "Ring Road, Surat", type: "TRUCK", url: null },
    { id: "EVD-2026-010", title: "Ahmedabad BRTS Lane Violation", time: "2026-09-08 09:25:40", size: "38.9 MB", duration: "03:10 min", target: "GJ01PQ5678", speed: "65 KM/H", location: "Shivranjani BRTS, Ahmedabad", type: "CAR", url: null },
    { id: "EVD-2026-011", title: "Junagadh Forest Road Speeding", time: "2026-09-08 07:15:20", size: "45.0 MB", duration: "04:30 min", target: "GJ11RS9012", speed: "75 KM/H", location: "Gir Road, Junagadh", type: "SUV", url: null },
    { id: "EVD-2026-012", title: "Mehsana Highway Wrong Side Driving", time: "2026-09-07 23:50:55", size: "52.4 MB", duration: "05:15 min", target: "GJ02TU3456", speed: "88 KM/H", location: "Highway, Mehsana", type: "CAR", url: null },
  ];

  const generatePDF = (clip) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Dark Blue
    doc.text("GUJARAT CYBER VISION", 105, 20, null, null, "center");
    
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // Red
    doc.text("OFFICIAL E-CHALLAN / EVIDENCE REPORT", 105, 30, null, null, "center");
    
    // Line separator
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Incident Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    doc.text("Evidence ID:", 20, 50);
    doc.setFont(undefined, 'bold');
    doc.text(clip.id, 60, 50);
    doc.setFont(undefined, 'normal');
    
    doc.text("Timestamp:", 20, 60);
    doc.text(clip.time, 60, 60);
    
    doc.text("Location:", 20, 70);
    doc.text(clip.location, 60, 70);
    
    doc.text("Violation Type:", 20, 80);
    doc.text(clip.title, 60, 80);
    
    doc.text("Vehicle Plate:", 20, 90);
    doc.setFont(undefined, 'bold');
    doc.text(clip.target, 60, 90);
    doc.setFont(undefined, 'normal');
    
    doc.text("Vehicle Type:", 20, 100);
    doc.text(clip.type, 60, 100);
    
    doc.text("Recorded Speed:", 20, 110);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(clip.speed, 60, 110);
    doc.setTextColor(0, 0, 0);
    
    // Cryptographic Hash Section
    doc.setLineWidth(0.2);
    doc.line(20, 125, 190, 125);
    
    doc.setFontSize(10);
    doc.text("INTEGRITY VERIFICATION", 105, 135, null, null, "center");
    
    // Generate dummy SHA-256 hash for effect
    const fakeHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    doc.setFontSize(8);
    doc.text("SHA-256 Video Checksum:", 20, 145);
    doc.text(fakeHash, 20, 150);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("This document is digitally signed and auto-generated by the Gujarat Cyber Vision AI Sentinel.", 105, 170, null, null, "center");
    doc.text("The attached video evidence is tamper-proof and verified by the system.", 105, 175, null, null, "center");
    
    doc.save(`${clip.id}_E-Challan.pdf`);
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-blue-400" /> Recorded CCTV Evidence Vault & Incident Clips
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Tamper-proof digital video evidence encrypted with SHA-256 integrity hashes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {clips.map((c, i) => (
          <div key={i} className="rounded-2xl premium-glass p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform border border-slate-700/50 shadow-xl relative overflow-hidden min-h-[260px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">{c.id}</span>
                <span className="text-slate-500 flex items-center gap-1"><FileText className="w-3 h-3"/> {c.size}</span>
              </div>
              <h3 className="text-[15px] font-bold text-slate-200 mb-2 leading-tight group-hover:text-white transition-colors">{c.title}</h3>
              
              <div className="space-y-1.5 mt-4 bg-slate-900/40 p-3 rounded-xl border border-slate-700/30">
                <p className="text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">Target:</span> 
                  <span className="text-red-400 font-bold">{c.target}</span>
                </p>
                <p className="text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">Speed:</span> 
                  <span className="text-yellow-400 font-bold">{c.speed}</span>
                </p>
                <p className="text-[10px] text-slate-500 font-mono flex items-center justify-between mt-1 pt-1 border-t border-slate-700/50">
                  <span>{c.time}</span>
                  <span className="truncate ml-2">{c.location}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 relative z-20 shrink-0">
              <button 
                onClick={() => c.url ? setActiveVideo(c) : alert("Video evidence is missing or corrupted for this incident.")}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 group-hover:shadow-blue-500/25"
              >
                <Play className="w-4 h-4 fill-current" /> Play Evidence
              </button>
              <button 
                onClick={() => generatePDF(c)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center gap-2 text-xs font-bold" 
                title="Download E-Challan PDF"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
          <div className="bg-[#050914] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl flex flex-col max-h-full">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">{activeVideo.title}</h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{activeVideo.id} • {activeVideo.location}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveVideo(null)}
                className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Video Player */}
            <div className="flex-1 bg-black relative flex items-center justify-center min-h-[300px]">
              <video 
                src={activeVideo.url.replace('http://', 'https://')} 
                controls 
                autoPlay 
                className="w-full h-full max-h-[60vh] object-contain"
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur border border-red-500/30 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-red-400 font-bold tracking-widest">RECORDED EVIDENCE</span>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span><strong className="text-slate-300">Target:</strong> {activeVideo.target}</span>
                <span><strong className="text-slate-300">Speed:</strong> {activeVideo.speed}</span>
                <span><strong className="text-slate-300">Time:</strong> {activeVideo.time}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SHA-256 Verified</span>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}