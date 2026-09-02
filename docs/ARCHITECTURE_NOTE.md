# Non-Intrusive Multi-VMS Feed Aggregation Architecture Note
**Project:** Gujarat Cyber Vision — Sentinel Shield 2.4  
**Subject:** Technical Verification of Zero-Middleware Non-Intrusive Direct Ingestion Architecture

---

## 1. Executive Summary

Under the **Unified Viewing Platform Model**, central command operators require simultaneous operational visibility across disparate CCTV networks managed by multiple departmental entities (e.g. Municipal Corporations, State Transport GSRTC, Gujarat Police, and Private Commercial Shop NVRs). 

Each department operates its own dedicated Video Management System (VMS) such as Milestone, HikCentral, Dahua DSS, or standalone Network Video Recorders (NVRs).

**Core Architectural Principle:**  
*The proposed Unified Viewing Platform operates in a strictly **read-only, consume-only** model. It connects directly to available standard RTSP / ONVIF / WHEP streaming endpoints without installing software agents, introducing intermediate federation middleware, or altering existing local storage or VMS configurations.*

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                        EXISTING DEPARTMENTAL INFRASTRUCTURE                       |
|                          (100% Autonomous & Unaltered)                           |
+-----------------------------------------------------------------------------------+
       |                                      |                                  |
       v                                      v                                  v
+------------------+                  +------------------+             +-------------------+
| Municipal Corp   |                  |  State Transport |             |  Commercial /     |
| (AMC / SMC VMS)  |                  |   (GSRTC NVR)    |             |  Shop NVR (ONVIF) |
| Local Storage    |                  | Local Storage    |             | Local SD/HDD      |
+------------------+                  +------------------+             +-------------------+
       | (RTSP over TCP)                      | (RTSP over TCP)                  | (ONVIF Profile S)
       +--------------------------------------+----------------------------------+
                                              |
                                              v (Direct Unicast Consume-Only Pull)
+-----------------------------------------------------------------------------------+
|               GUJARAT CYBER VISION — UNIFIED VIEWING & ANALYTICS LAYER            |
+-----------------------------------------------------------------------------------+
|  [Hardware Decoder Engine] (OpenCV FFMPEG Low-Latency Ring Buffer)                |
|  [PTS Monotonic Clock Tracker] (Monotonic Presentation Timestamps)                |
|  [AI Analytics Engine] (Selective YOLOv8 Vehicle Detection + ByteTrack + ANPR)    |
|  [Tactical 2x2 / 3x3 Video Wall] (Multi-Stream Browser Synchronization)           |
+-----------------------------------------------------------------------------------+
                                              |
                                              v (Metadata Records Only)
+-----------------------------------------------------------------------------------+
|                  CENTRAL METADATA & GAP-ANALYSIS REPOSITORY                       |
|        (SQLite / PostgreSQL - Vehicle Plates, Timestamps, Audit Records)          |
|                 *Zero Central Storage of Raw Video Required*                      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Key Architectural Guarantees

### A. Non-Intrusive Ingestion
- **No Local Write Access:** The platform never modifies camera configurations, PTZ presets, schedules, or user permissions on source VMS/NVR systems.
- **Standards-Compliant Pull:** Video is consumed strictly via standard **RTSP over TCP (Port 8554 / 554)** and **WebRTC (WHEP, Port 8889)**.
- **Bandwidth Preservation:** Connections are opened **on-demand** when actively viewed by an operator and closed immediately when released, preventing bandwidth saturation on edge networks.

### B. Decoupled AI Analytics (Selective Metadata Generation)
- **Zero Full-Video Central Storage:** To avoid petabytes of redundant storage costs, the platform stores **only metadata events** (Vehicle Class, License Plate Number, Time, GPS Location, and Confidence Score).
- **Asynchronous Processing Workers:** Dedicated AI background threads pull frames into a bounded queue, ensuring real-time 30–60 FPS video delivery to operators without compute stalls.

### C. Network Resilience & Reconnect Backoff
- **Exponential Backoff:** If an edge camera feed restarts or experiences packet loss, the client implements an exponential backoff sequence (`2s → 4s → 8s → 16s → 30s`) to prevent connection flooding.
- **Scene Discontinuity Recovery:** Automatically cleans tracked vehicle caches across looping video streams or stream resets.

---

## 4. Verification Deliverables Completed

1. **Dual-System Ingestion Verified:** Live simultaneous ingestion from **System 1 (Sentinel Operational CCTV Grid)** and **System 2 (Remote COREPRIX 5MP IP Camera / Shop NVR)**.
2. **Real-Time ANPR Engine Verified:** YOLOv8 + EasyOCR extracting license plates with speed-optimized single-thread PyTorch execution.
3. **Multi-Camera Tactical Video Wall:** Configurable 2x2 and 3x3 simultaneous viewing matrix.
4. **Searchable Metadata Repository:** Indexed vehicle detection records with search, filter, and alert deduplication.
