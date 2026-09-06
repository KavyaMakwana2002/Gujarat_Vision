import cv2
import time
import os
import threading
import random
import numpy as np

# Suppress low-level FFmpeg macroblock and decoder debug spam
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"
os.environ["OPENCV_LOG_LEVEL"] = "FATAL"
os.environ["AV_LOG_FORCE_NOCOLOR"] = "1"
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000|reorder_queue_size;0|stimeout;5000000"
try:
    cv2.setLogLevel(0)
except Exception:
    pass

RTSP_USER = "kavyamak11%40gmail.com"
RTSP_PASS = "X64V-9ZAQ-T5AN"
RTSP_HOST = "103.250.160.189:8554"

import re

CAMERA_SOURCE_MAPPINGS = {
    "toll-ne1-01": "cam12",
    "toll-ne1-02": "cam05",
    "toll-nh48-03": "cam17",
    "toll-nh27-04": "cam07",
    "toll-sh10-05": "cam12",
}

CAMERA_METADATA_MAP = {
    "cam01": {"name": "Chiman bhai Bridge", "city": "Ahmedabad", "junction": "Overpass Bridge Post"},
    "cam02": {"name": "Janpath", "city": "Ahmedabad", "junction": "Arterial Junction Post"},
    "cam03": {"name": "O.N.G.C. Office", "city": "Ahmedabad", "junction": "Chandkheda Institutional Post"},
    "cam04": {"name": "Paldi Circle", "city": "Ahmedabad", "junction": "Urban Traffic Circle"},
    "cam05": {"name": "Visat teen Rasta", "city": "Ahmedabad", "junction": "Sabarmati Tri-Junction"},
    "cam06": {"name": "Timbavadi gate-Junagadh", "city": "Junagadh", "junction": "City Entry Gate"},
    "cam07": {"name": "hero-showroom-gir-somnath", "city": "Gir Somnath", "junction": "Highway Commercial Post"},
    "cam08": {"name": "majewadi-gate-junagadh", "city": "Junagadh", "junction": "Historic Checkpost Gate"},
    "cam09": {"name": "new-bypass-near-by-circle-junagadh-2", "city": "Junagadh", "junction": "Highway Bypass Circle"},
    "cam10": {"name": "char-chowk-road-2-junagadh", "city": "Junagadh", "junction": "Central Four-Ways"},
    "cam11": {"name": "dolatpara-junagadh", "city": "Junagadh", "junction": "GIDC Industrial Highway"},
    "cam12": {"name": "Tri Mandir Adalaj Tollnaka", "city": "Gandhinagar", "junction": "Toll Plaza Highway Node"},
    "cam13": {"name": "CN Vidhyalaya", "city": "Ahmedabad", "junction": "Ambawadi Urban Corridor"},
    "cam14": {"name": "Delight RLVD", "city": "Ahmedabad", "junction": "Red Light Violation Detection"},
    "cam15": {"name": "Suvidha park", "city": "Ahmedabad", "junction": "Satellite Residential Post"},
    "cam16": {"name": "Visat P2", "city": "Ahmedabad", "junction": "Chandkheda Secondary Post"},
    "cam17": {"name": "Rajkot Bus Port CCTV", "city": "Rajkot", "junction": "Transit Terminal Node"},
    "cam18": {"name": "Rajkot CCTV", "city": "Rajkot", "junction": "Downtown Trikon Baug"},
    "cam19": {"name": "KHAPARIA GRAM PANCHAYAT", "city": "Navsari", "junction": "Panchayat Security Post"},
    "cam20": {"name": "Mohanpura", "city": "Ahmedabad", "junction": "Kalupur Station Approach"},
    "cam21": {"name": "Patan Dethali Char Rasta", "city": "Patan", "junction": "North Gujarat Highway Post"},
    "cam22": {"name": "BK Mervada tran Rasta", "city": "Banaskantha", "junction": "Border Corridor Post"},
    "cam23": {"name": "kheram", "city": "Mehsana", "junction": "State Highway 41 Node"},
    "cam24": {"name": "dehgam", "city": "Gandhinagar", "junction": "Capital Corridor Crossroads"},
    "cam25": {"name": "dhanori", "city": "Navsari", "junction": "South Gujarat Post"},
    "cam26": {"name": "TANKAL", "city": "Navsari", "junction": "Tankal Checkpost"},
    "cam27": {"name": "bilimora (cam27)", "city": "Navsari", "junction": "Bilimora Port Link Node 1"},
    "cam28": {"name": "bilimora (cam28)", "city": "Navsari", "junction": "Bilimora Town Center Node 2"},
    "cam29": {"name": "bilimora (cam29)", "city": "Navsari", "junction": "Bilimora Highway Node 3"},
    "cam30": {"name": "Gandhidham Rambaugh p2", "city": "Kutch", "junction": "Kutch Border Highway Node"}
}

def resolve_camera_source(source):
    """
    Resolve camera identifiers (cam01..cam30, toll-*, webcam, etc.)
    directly to their 1:1 real RTSP hardware URLs.
    """
    s = str(source).strip()
    if s.lower() in ["webcam", "local", "laptop", "0"]:
        return 0
    if s.startswith("rtsp://") and "@" in s:
        return s
    if s.startswith("http://") or s.startswith("https://"):
        return s
    if s in CAMERA_SOURCE_MAPPINGS:
        s = CAMERA_SOURCE_MAPPINGS[s]
    if "-cam" in s.lower():
        s = "cam" + s.lower().split("-cam")[-1]
        
    digits = re.findall(r'\d+', s)
    cam_num = int(digits[0]) if digits else 1
    
    return f"rtsp://{RTSP_USER}:{RTSP_PASS}@{RTSP_HOST}/stream/cam{cam_num:02d}"

# Global shared camera and detector instances
_detector_instance = None
_detector_lock = threading.Lock()
_stream_pool = {}
_pool_lock = threading.Lock()
CURRENT_STREAM_SOURCE = resolve_camera_source("cam01")
IS_CAMERA_ACTIVE = True

def get_detector():
    global _detector_instance
    with _detector_lock:
        if _detector_instance is None:
            from src.detection.detector import SentinelDetector
            _detector_instance = SentinelDetector()
        return _detector_instance

def normalize_cam_key(source):
    s = str(source).strip().lower()
    if s in ["webcam", "local", "laptop", "0"]:
        return "webcam"
    if s in CAMERA_SOURCE_MAPPINGS:
        return CAMERA_SOURCE_MAPPINGS[s]
    digits = re.findall(r'\d+', s)
    if digits:
        return f"cam{int(digits[0]):02d}"
    return s


class MasterStreamEngine:
    """
    Ultra-Smooth 30-60 FPS Real Camera RTSP Video Stream Engine with Asynchronous AI Inference.
    Supports instant switching and real RTSP hardware feeds across all 30+ cameras.
    """
    def __init__(self, src="standby", active=True, cam_id="cam01"):
        self.src = src
        self.cam_id = normalize_cam_key(cam_id)
        self.is_active = active
        self.cap = None
        self.running = True
        self.lock = threading.Lock()
        
        self.raw_frame = None
        self.annotated_frame = None
        
        meta = CAMERA_METADATA_MAP.get(self.cam_id, {})
        self.active_cam_id = str(self.cam_id).upper()
        self.active_city = meta.get("city", "Ahmedabad")
        self.active_junction = meta.get("junction", meta.get("name", "Sentinel Surveillance Grid"))
        self._switch_pending = False
        self._stop_pending = False
        self._is_hardware_connected = False

        if self.is_active and self.src != "standby":
            self._switch_pending = True

        # Thread 1: Hardware Frame Ingestion
        self.capture_thread = threading.Thread(target=self._capture_worker, daemon=True)
        self.capture_thread.start()
        
        # Thread 2: Asynchronous AI Inference (YOLOv8 + ANPR Worker)
        self.ai_thread = threading.Thread(target=self._ai_worker, daemon=True)
        self.ai_thread.start()

    def _safe_open_capture(self, src):
        """Connect directly to hardware RTSP/Webcam stream with robust multi-packet keyframe sync."""
        try:
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000|reorder_queue_size;0|stimeout;5000000"

            if isinstance(src, int) or str(src) in ["0", "webcam"]:
                new_cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                if not new_cap or not new_cap.isOpened():
                    new_cap = cv2.VideoCapture(0)
            else:
                new_cap = cv2.VideoCapture(src, cv2.CAP_FFMPEG)
                if not new_cap or not new_cap.isOpened():
                    new_cap = cv2.VideoCapture(src)

            if new_cap and new_cap.isOpened():
                if isinstance(src, int) or str(src) in ["0", "webcam"]:
                    new_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    new_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    new_cap.set(cv2.CAP_PROP_FPS, 30)
                new_cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                
                # Check read frames
                for _ in range(30):
                    ret, frame = new_cap.read()
                    if ret and frame is not None and frame.size > 0:
                        print(f"[+] Real Camera hardware stream ACTIVE [{self.cam_id}]: {src}")
                        self._is_hardware_connected = True
                        with self.lock:
                            self.raw_frame = frame
                        return new_cap
                    time.sleep(0.04)
                    
                # Keep capture open if isOpened is true
                print(f"[+] Real Camera isOpened [{self.cam_id}]: {src}")
                return new_cap
            return None
        except Exception as e:
            print(f"[-] Capture open exception [{self.cam_id}]: {e}")
            return None

    def _safe_release_capture(self):
        self._is_hardware_connected = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

    def start(self, new_src=0):
        with self.lock:
            old_src = self.src
            self.src = new_src
            self.is_active = True
            if str(old_src) != str(new_src):
                self.raw_frame = None
                self.annotated_frame = None
                self._switch_pending = True

    def stop(self):
        with self.lock:
            self.is_active = False
            self.src = "standby"
            self.raw_frame = None
            self.annotated_frame = None
            self._stop_pending = True

    def _capture_worker(self):
        consecutive_errors = 0
        last_reconnect_time = 0.0

        while self.running:
            if self._stop_pending:
                self._stop_pending = False
                self._safe_release_capture()
                time.sleep(0.1)
                continue

            if self._switch_pending:
                self._switch_pending = False
                self._safe_release_capture()
                
                new_cap = self._safe_open_capture(self.src)
                if new_cap:
                    self.cap = new_cap
                    consecutive_errors = 0
                time.sleep(0.1)
                continue

            if self.is_active and self.src != "standby":
                if self.cap is not None and self.cap.isOpened():
                    ret, frame = self.cap.read()
                    if ret and frame is not None and frame.size > 0:
                        consecutive_errors = 0
                        self._is_hardware_connected = True
                        with self.lock:
                            self.raw_frame = frame
                    else:
                        consecutive_errors += 1
                        if consecutive_errors > 200: # ~6-8s of persistent failure before restart
                            self._safe_release_capture()
                            consecutive_errors = 0
                        time.sleep(0.03)
                else:
                    # Auto-reconnect real hardware camera periodically in background
                    now = time.time()
                    if now - last_reconnect_time > 2.0:
                        last_reconnect_time = now
                        new_cap = self._safe_open_capture(self.src)
                        if new_cap:
                            self.cap = new_cap
                            consecutive_errors = 0
                    time.sleep(0.05)
            else:
                time.sleep(0.1)

    def _ai_worker(self):
        while self.running:
            if not self.is_active:
                time.sleep(0.1)
                continue

            frame_to_process = None
            with self.lock:
                if self.raw_frame is not None:
                    frame_to_process = self.raw_frame.copy()
            
            if frame_to_process is not None:
                try:
                    detector = get_detector()
                    h_orig, w_orig = frame_to_process.shape[:2]
                    # Resize for fast YOLOv8 inference
                    target_w = 640
                    target_h = int(target_w * h_orig / max(1, w_orig))
                    infer_frame = cv2.resize(frame_to_process, (target_w, target_h))

                    loc_name = f"{self.active_junction} ({self.active_city})" if self.active_junction else f"{self.active_city} Surveillance Post"
                    processed = detector.detect_objects(
                        infer_frame, 
                        camera_id=str(self.active_cam_id).upper(), 
                        location_name=loc_name
                    )
                    with self.lock:
                        self.annotated_frame = processed
                except Exception as e:
                    print(f"[-] AI Worker Exception: {e}")
                    import traceback
                    traceback.print_exc()
                    with self.lock:
                        self.annotated_frame = frame_to_process
                time.sleep(0.02)
            else:
                time.sleep(0.03)

    def _get_standby_frame(self, w=640, h=480):
        """Sleek high-security Gujarat Police surveillance HUD standby screen."""
        frame = np.full((h, w, 3), (15, 23, 42), dtype=np.uint8) # Dark slate
        # Tech grid lines
        for x in range(0, w, 40):
            cv2.line(frame, (x, 0), (x, h), (24, 34, 53), 1)
        for y in range(0, h, 40):
            cv2.line(frame, (0, y), (w, y), (24, 34, 53), 1)
            
        cv2.putText(frame, "GUJARAT POLICE SENTINEL SHIELD", (w//2 - 190, h//2 - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (56, 189, 248), 2)
        cv2.putText(frame, f"INITIALIZING REAL CCTV VIDEO: {self.active_cam_id}...", (w//2 - 180, h//2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (250, 204, 21), 1)
        cv2.putText(frame, f"NODE: {self.active_junction} ({self.active_city})", (w//2 - 160, h//2 + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (148, 163, 184), 1)
        return frame

    def get_jpeg_frame(self, cam_id=None, city=None, junction=None):
        if cam_id:
            self.active_cam_id = str(cam_id).upper()
        if city:
            self.active_city = str(city)
        if junction:
            self.active_junction = str(junction)

        display_frame = None
        with self.lock:
            if self.is_active:
                if self.annotated_frame is not None:
                    display_frame = self.annotated_frame.copy()
                elif self.raw_frame is not None:
                    display_frame = self.raw_frame.copy()

        if display_frame is None:
            # Standby screen while hardware stream connects
            display_frame = self._get_standby_frame(640, 480)

        # Scale down to crisp web-friendly resolution (e.g. max 800 width) for 60fps low bandwidth
        h_orig, w_orig = display_frame.shape[:2]
        if w_orig > 800:
            target_w = 800
            target_h = int(target_w * h_orig / w_orig)
            display_frame = cv2.resize(display_frame, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

        h, w = display_frame.shape[:2]
        
        # High-Tech Police Surveillance HUD
        cv2.rectangle(display_frame, (10, 10), (w - 10, 42), (10, 15, 26), -1)
        cv2.putText(display_frame, f"GUJARAT POLICE • CAM #{self.active_cam_id} ({self.active_city.upper()})", (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (56, 189, 248), 2)
        live_tag = "LIVE • REAL CCTV" if self._is_hardware_connected else "CONNECTING..."
        tag_color = (52, 211, 153) if self._is_hardware_connected else (250, 204, 21)
        cv2.putText(display_frame, f"{time.strftime('%H:%M:%S')} | {live_tag}", (w - 180, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.38, tag_color, 1)

        cv2.rectangle(display_frame, (10, h - 30), (w - 10, h - 10), (10, 15, 26), -1)
        feed_mode = "RTSP REAL VIDEO" if self._is_hardware_connected else "CONNECTING NODE..."
        cv2.putText(display_frame, f"NODE: {self.active_junction} | {feed_mode} | AI ANPR & VAHAN: ACTIVE", (16, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (250, 204, 21), 1)

        ret, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        if ret:
            return buffer.tobytes()
        return None

    def release(self):
        self.running = False
        self._stop_pending = True


def get_stream_engine(cam_id="cam01", active=True):
    global _stream_pool
    key = normalize_cam_key(cam_id)
    resolved_src = resolve_camera_source(cam_id)
    
    with _pool_lock:
        if key not in _stream_pool or not _stream_pool[key].running:
            engine = MasterStreamEngine(src=resolved_src, active=active, cam_id=key)
            _stream_pool[key] = engine
        return _stream_pool[key]

def start_camera(source="cam01"):
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE
    resolved = resolve_camera_source(source)
    key = normalize_cam_key(source)
    
    CURRENT_STREAM_SOURCE = resolved
    IS_CAMERA_ACTIVE = True
    
    engine = get_stream_engine(key, active=True)
    engine.start(resolved)
    return {"status": "active", "source": str(CURRENT_STREAM_SOURCE), "camera_id": key}

def stop_camera():
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE
    IS_CAMERA_ACTIVE = False
    CURRENT_STREAM_SOURCE = "standby"
    with _pool_lock:
        for eng in _stream_pool.values():
            eng.stop()
    return {"status": "standby", "source": "standby"}

def set_stream_source(source):
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE
    resolved = resolve_camera_source(source)
    key = normalize_cam_key(source)
    
    CURRENT_STREAM_SOURCE = resolved
    IS_CAMERA_ACTIVE = True
    
    engine = get_stream_engine(key, active=True)
    engine.start(resolved)
    return str(CURRENT_STREAM_SOURCE)

def get_current_source():
    return str(CURRENT_STREAM_SOURCE)

def get_camera_state():
    return {"is_active": IS_CAMERA_ACTIVE, "source": str(CURRENT_STREAM_SOURCE)}

import asyncio

async def generate_video_stream(cam_id: str = "cam01", city: str = "Ahmedabad", junction: str = "Sentinel Grid"):
    clean_id = normalize_cam_key(cam_id or "cam01")
    engine = get_stream_engine(clean_id, active=True)
    
    try:
        while True:
            frame_bytes = engine.get_jpeg_frame(cam_id=clean_id, city=city, junction=junction)
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            await asyncio.sleep(0.033)
    except asyncio.CancelledError:
        return
    except BaseException:
        return