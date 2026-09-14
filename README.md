# 🛡️ Gujarat Cyber Vision - Sentinel Shield 2.4

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://www.python.org/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Computer%20Vision-blueviolet.svg)](https://ultralytics.com/)

**Gujarat Cyber Vision (Sentinel Shield 2.4)** is an enterprise-grade, vendor-neutral video surveillance and intelligence platform engineered for **Gujarat Police, Home Department, and Smart Cities Mission**. 

It is designed to handle the large-scale integration of **80,000+ CCTV camera feeds** distributed across the state. The system combines **Edge AI Inference**, **Automated Number Plate Recognition (ANPR)**, **High-Performance Vehicle Tracking**, and direct real-time synchronization with **National & State Criminal Registries (VAHAN 4.0, eGujCop CCTNS)** to instantly detect stolen vehicles, wanted offenders, and highway safety violations.

---

## ✨ Key Features

- **🌐 Sentinel Live AI Hub**: Centralized, real-time AI processing for advanced threat detection and live alerting.
- **📷 Camera Matrix**: Scalable multi-camera live streaming and synchronized monitoring grid.
- **🚔 Stolen Registry Integration**: Instant fuzzy matching with VAHAN 4.0 & eGujCop CCTNS databases to track stolen vehicles.
- **🗺️ GIS Mapping & Smart City Hub**: Interactive visual map tracking vehicle movements, incidents, and camera locations.
- **🏎️ Speed Detection & ANPR**: Integrated YOLOv8 and EasyOCR pipeline for real-time speed calculation and number plate reading.
- **👩‍🦰 Women Safety & Threat Detection**: Proactive monitoring and alerting for unusual activities or distress situations.
- **📂 Evidence Vault**: Secure logging and storage of flagged incidents, captured plates, and violation clips.

## 💻 Tech Stack

### Frontend (Client)
- **Framework**: React.js, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Icons**: Lucide React
- **Mapping**: Leaflet / React-Leaflet

### Backend & AI (Server)
- **Language**: Python 3.9+
- **AI/ML Models**: YOLOv8 (Ultralytics) for Object Detection
- **Tracking**: ByteTrack
- **OCR**: EasyOCR
- **Video Processing**: OpenCV, Decoupled Threading Architecture

## 🚀 Quick Start

### 1. Start the Python Backend Server
Navigate to the server directory, install dependencies, and run the main server.
```bash
cd server
pip install -r requirements.txt
python run_server.py
```
*(Ensure you have the required weights like `yolov8n.pt` downloaded in the root directory)*

### 2. Start the React Frontend Client
Navigate to the client directory, install NPM packages, and start the development server.
```bash
cd client
npm install
npm run dev
```

Open your browser and visit `http://localhost:5173` (or the port provided by Vite).

---

## 📜 Architecture Overview

Please refer to the [PROJECT_ARCHITECTURE_AND_FLOW.md](./PROJECT_ARCHITECTURE_AND_FLOW.md) for an in-depth look into the system's ingestion layers, AI pipelines, and government registry synchronization flows.

## 🛡️ Hackathon 2026 - Safer Gujarat, Stronger Tomorrow
*Built with ❤️ for Gujarat Police Hackathon 2026.*
