# 🚀 Gujarat Cyber Vision — React Client

Modern React 18 + Vite + Tailwind CSS + Lucide Icons Single-Page Application (SPA) for the **Sentinel Shield 2.4 Command Center**.

---

## ⚡ Features Included

* **11 Full Command Views**:
  1. Mission Control & Active Live Stream
  2. 80,000 Live Camera Grid with district filters & pagination
  3. Live Location Hubs across Gujarat
  4. Interactive Gujarat Police GIS Leaflet Map
  5. Vehicle Specifications & RTO Master Registry
  6. Instant License Plate Search & ANPR Log
  7. Recorded Video Evidence Vault & MP4 Exports
  8. All Hotlist / Watchlist Red Alerts
  9. Stolen Car Register synced with eGujCop / VAHAN 4.0
  10. Blacklist Live GPS Target Interception
  11. Remote Shop NVR (COREPRIX 5MP & VPN Gateway)
* **Real-Time Backend Polling**: Auto-syncs stats, detections, and alerts with FastAPI backend.
* **1-Click Vercel Deployment**: Includes `vercel.json` for seamless SPA rewrites.

---

## 💻 Local Development

1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

---

## ☁️ Deploying on Vercel (1-Click)

1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Environment Variables**: `VITE_API_URL` = `https://your-python-backend.railway.app` (or your public backend URL).
5. Click **Deploy**! 🚀
