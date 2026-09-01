# 🧠 Sentinel Shield 2.4 — Python AI Surveillance Server

High-Performance Python FastAPI Backend running:
- **YOLOv8 + ByteTrack** Multi-Object Vehicle Tracking
- **EasyOCR ANPR** License Plate Extraction with TTL Caching
- **RTSP over TCP** Multi-Camera Ingestion Engine
- **VAHAN 4.0 & eGujCop** Stolen Vehicle Watchlist Matching
- **Red Alert Siren Engine**

---

## 💻 How to Run Locally

```bash
# Option 1: Direct Python Runner
python server/run_server.py

# Option 2: Using Uvicorn directly
python -m uvicorn src.backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be live at: `http://127.0.0.1:8000`  
API Swagger Documentation: `http://127.0.0.1:8000/docs`

---

## ☁️ Cloud Deployment Options

### 1. Deploy on Railway / Render (Free / GPU Cloud)
1. Link your GitHub repository.
2. Set Root Directory to repository root.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python server/run_server.py`
5. Copy your generated public URL (e.g. `https://your-backend.railway.app`) and set it as `VITE_API_URL` in your Vercel React Frontend!

### 2. Deploy via Docker
```bash
# Build Docker image
docker build -t sentinel-shield-server -f server/Dockerfile .

# Run Docker container
docker run -d -p 8000:8000 --name sentinel-server sentinel-shield-server
```
