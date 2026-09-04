import cv2
import time
import os
import threading
import numpy as np

RTSP_USER = "kavyamak11%40gmail.com"
RTSP_PASS = "X64V-9ZAQ-T5AN"
RTSP_HOST = "103.250.160.189:8554"

CAMERA_SOURCE_MAPPINGS = {
    "toll-ne1-01": "cam12",
    "toll-ne1-02": "cam05",
    "toll-nh48-03": "cam17",
    "toll-nh27-04": "cam07",
    "toll-sh10-05": "cam12",
}

def resolve_camera_source(source):
    """Resolve camera identifiers (e.g. cam01, cam12, toll-ne1-01, webcam, rtsp://) to live Sentinel Grid RTSP stream."""
    s = str(source).strip()
    if s.lower() in ["webcam", "local", "laptop"]:
        return 0
    if s in CAMERA_SOURCE_MAPPINGS:
        s = CAMERA_SOURCE_MAPPINGS[s]
    if "-cam" in s.lower():
        s = "cam" + s.lower().split("-cam")[-1]
    if s.lower().startswith("cam") and len(s) >= 4:
        clean_cam = s.lower()
        return f"rtsp://{RTSP_USER}:{RTSP_PASS}@{RTSP_HOST}/stream/{clean_cam}"
    if s.lower().startswith("cam") and len(s) == 3: # e.g. cam1 -> cam01
        try:
            num = int(s[3:])
            return f"rtsp://{RTSP_USER}:{RTSP_PASS}@{RTSP_HOST}/stream/cam{num:02d}"
        except Exception:
            pass
    if s.isdigit():
        val = int(s)
        if 1 <= val <= 30:
            return f"rtsp://{RTSP_USER}:{RTSP_PASS}@{RTSP_HOST}/stream/cam{val:02d}"
        return val
    if s.startswith("rtsp://") and "@" not in s:
        clean = s.replace("rtsp://", "")
        return f"rtsp://{RTSP_USER}:{RTSP_PASS}@{clean}"
    return source

# Global shared camera and detector instances - Always active by default
_detector_instance = None
_global_camera = None
_camera_lock = threading.Lock()
CURRENT_STREAM_SOURCE = resolve_camera_source("cam01")
IS_CAMERA_ACTIVE = True

def get_detector():
    global _detector_instance
    if _detector_instance is None:
        from src.detection.detector import SentinelDetector
        _detector_instance = SentinelDetector()
    return _detector_instance

def start_camera(source="cam01"):
    """Explicitly activate Sentinel Camera Grid feed (or local webcam) and begin video capture."""
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE, _global_camera
    resolved = resolve_camera_source(source)
    with _camera_lock:
        CURRENT_STREAM_SOURCE = resolved
        IS_CAMERA_ACTIVE = True

        if _global_camera:
            _global_camera.start(CURRENT_STREAM_SOURCE)
        else:
            _global_camera = MasterStreamEngine(CURRENT_STREAM_SOURCE, active=True)
            
    print(f"[+] Camera ACTIVATED with source: {CURRENT_STREAM_SOURCE}")
    return {"status": "active", "source": str(CURRENT_STREAM_SOURCE)}

def stop_camera():
    """Explicitly shut down camera hardware and turn off hardware LED."""
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE, _global_camera
    with _camera_lock:
        IS_CAMERA_ACTIVE = False
        CURRENT_STREAM_SOURCE = "standby"
        if _global_camera:
            _global_camera.stop()
            
    print("[-] Camera DEACTIVATED and hardware released.")
    return {"status": "standby", "source": "standby"}

def set_stream_source(source):
    """Set dynamic RTSP URL, Video file path, or Sentinel Grid Camera ID."""
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE, _global_camera
    resolved = resolve_camera_source(source)
    with _camera_lock:
        CURRENT_STREAM_SOURCE = resolved
        IS_CAMERA_ACTIVE = True
            
        if _global_camera:
            _global_camera.start(CURRENT_STREAM_SOURCE)
            
    print(f"[+] Active Live Stream Source set to: {CURRENT_STREAM_SOURCE}")
    return str(CURRENT_STREAM_SOURCE)

def get_current_source():
    return str(CURRENT_STREAM_SOURCE)

def get_camera_state():
    return {"is_active": IS_CAMERA_ACTIVE, "source": str(CURRENT_STREAM_SOURCE)}

class MasterStreamEngine:
    """
    Ultra-Smooth 30-60 FPS Video Stream Engine with Asynchronous AI Inference.
    Does NOT access camera hardware until activated by the user.
    
    IMPORTANT: Only the _capture_worker thread is allowed to touch self.cap (read/release/create).
    All other threads communicate via flags (_switch_pending, _stop_pending) to avoid
    concurrent FFmpeg access which causes 'Assertion fctx->async_lock failed' crashes.
    """
    def __init__(self, src="standby", active=False):
        self.src = src
        self.is_active = active
        self.cap = None  # ONLY touched by _capture_worker
        self.running = True
        self.lock = threading.Lock()
        
        self.raw_frame = None
        self.annotated_frame = None
        self.cached_jpeg = None
        
        self.detector = None
        self.latest_boxes = []
        
        # Thread-safe switch/stop signaling (main thread -> worker thread)
        self._switch_pending = False
        self._stop_pending = False
        
        if self.is_active and self.src != "standby":
            self._switch_pending = True  # Let worker handle initial connection
        
        self.active_cam_id = "CAM01"
        self.active_city = "Ahmedabad"
        self.active_junction = "SG Highway Corridor"

        # Thread 1: Hardware Frame Ingestion (30-60 FPS)
        self.capture_thread = threading.Thread(target=self._capture_worker, daemon=True)
        self.capture_thread.start()
        
        # Thread 2: Asynchronous AI Inference (YOLOv8 + ANPR Worker)
        self.ai_thread = threading.Thread(target=self._ai_worker, daemon=True)
        self.ai_thread.start()

    def _safe_open_capture(self, src):
        """Create a new VideoCapture. Called ONLY from _capture_worker thread."""
        try:
            # Set ultra-fast 2.5s TCP connection & socket timeout for RTSP feeds
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|stimeout;2500000|max_delay;500000|buffer_size;102400"

            if isinstance(src, int) or str(src) == "0":
                new_cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                if not new_cap or not new_cap.isOpened():
                    new_cap = cv2.VideoCapture(0)
            else:
                new_cap = cv2.VideoCapture(src, cv2.CAP_FFMPEG)
                if not new_cap or not new_cap.isOpened():
                    new_cap = cv2.VideoCapture(src)

            if new_cap and new_cap.isOpened():
                if isinstance(src, int) or str(src) == "0":
                    new_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    new_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    new_cap.set(cv2.CAP_PROP_FPS, 30)
                
                new_cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                print(f"[+] Camera stream successfully opened: {src}")
                return new_cap
            else:
                print(f"[-] VideoCapture could not connect immediately to source: {src}")
                return None
        except Exception as e:
            print(f"[-] Capture Init Warning: {e}")
            return None

    def _safe_release_capture(self):
        """Release current capture. Called ONLY from _capture_worker thread."""
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

    def start(self, new_src=0):
        """Signal the worker thread to switch to a new source. Does NOT touch self.cap."""
        with self.lock:
            old_src = self.src
            self.src = new_src
            self.is_active = True
            if str(old_src) != str(new_src):
                print(f"[*] Requesting camera switch from {old_src} to {new_src}...")
                self.raw_frame = None
                self.annotated_frame = None
                self.cached_jpeg = None
                self._switch_pending = True  # Signal worker to handle the switch

    def stop(self):
        """Signal the worker thread to stop and release the camera."""
        with self.lock:
            self.is_active = False
            self.src = "standby"
            self.raw_frame = None
            self.annotated_frame = None
            self._stop_pending = True  # Signal worker to release capture

    def _capture_worker(self):
        """
        Dedicated thread continuously pulling fresh frames at maximum hardware speed.
        This is the ONLY thread that touches self.cap (create/read/release).
        """
        fail_count = 0
        while self.running:
            # Handle stop signal
            if self._stop_pending:
                self._stop_pending = False
                self._safe_release_capture()
                fail_count = 0
                time.sleep(0.1)
                continue

            # Handle source switch signal
            if self._switch_pending:
                self._switch_pending = False
                self._safe_release_capture()
                time.sleep(0.3)  # Give FFmpeg threads time to clean up
                
                # Open new capture
                new_cap = self._safe_open_capture(self.src)
                if new_cap:
                    self.cap = new_cap
                    fail_count = 0
                else:
                    time.sleep(1.0)
                continue

            if self.is_active and self.src != "standby":
                if self.cap is None or not self.cap.isOpened():
                    # Try to connect (initial or reconnect)
                    new_cap = self._safe_open_capture(self.src)
                    if new_cap:
                        self.cap = new_cap
                        fail_count = 0
                    else:
                        time.sleep(2.0)
                    continue

                ret, frame = self.cap.read()
                if ret and frame is not None:
                    fail_count = 0
                    with self.lock:
                        self.raw_frame = frame
                else:
                    fail_count += 1
                    if fail_count > 25:
                        print(f"[-] Frame drop or stream lost on: {self.src}, reconnecting...")
                        self._safe_release_capture()
                        fail_count = 0
                        time.sleep(0.5)
                    else:
                        time.sleep(0.02)
            else:
                time.sleep(0.1)

    def _ai_worker(self):
        """Asynchronous AI worker running object detection without blocking stream rendering."""
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
                    if self.detector is None:
                        self.detector = get_detector()
                    
                    # Resize to standard 640px wide for lightning fast YOLOv8 inference
                    h_orig, w_orig = frame_to_process.shape[:2]
                    if w_orig > 640:
                        infer_frame = cv2.resize(frame_to_process, (640, int(640 * h_orig / w_orig)))
                    else:
                        infer_frame = frame_to_process

                    loc_name = f"{self.active_junction} ({self.active_city})" if self.active_junction else f"{self.active_city} Surveillance Post"
                    processed = self.detector.detect_objects(
                        infer_frame, 
                        camera_id=str(self.active_cam_id).upper(), 
                        location_name=loc_name
                    )
                    with self.lock:
                        self.annotated_frame = processed
                except Exception as e:
                    pass
                time.sleep(0.015)
            else:
                time.sleep(0.03)

    def get_jpeg_frame(self, cam_id=1, city="Ahmedabad", junction="SG Highway"):
        """Get ultra-smooth, freshly rendered JPEG frame with zero delay."""
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

        # If camera is inactive or not connected, render sleek command standby canvas
        if display_frame is None:
            display_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            display_frame[:] = (10, 15, 26) # Tactical Dark Navy
            
            # Draw standby police HUD box
            cv2.rectangle(display_frame, (20, 40), (620, 440), (22, 30, 49), -1)
            cv2.rectangle(display_frame, (20, 40), (620, 440), (37, 99, 235), 2)
            
            cv2.putText(display_frame, "GUJARAT POLICE SENTINEL SHIELD 2.4", (130, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (56, 189, 248), 2)
            if not self.is_active:
                cv2.putText(display_frame, "HARDWARE CAMERA IS CURRENTLY IN STANDBY", (130, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (250, 204, 21), 1)
                cv2.putText(display_frame, "Click 'Turn On Camera' on dashboard to activate stream", (110, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (148, 163, 184), 1)
            else:
                cv2.putText(display_frame, f"CONNECTING TO RTSP NODE: {str(cam_id).upper()}...", (150, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (56, 189, 248), 1)
                cv2.putText(display_frame, "RTSP Gateway: 103.250.160.189:8554 (TCP Transport)", (120, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (148, 163, 184), 1)
                cv2.putText(display_frame, "If node is down on the field, select another camera from Matrix", (85, 305), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (251, 146, 60), 1)
            
            cv2.putText(display_frame, f"Location: {junction} ({city.upper()})", (160, 365), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (100, 116, 139), 1)

        h, w = display_frame.shape[:2]
        
        # High-Tech Police Surveillance HUD
        cv2.rectangle(display_frame, (10, 10), (w - 10, 42), (10, 15, 26), -1)
        cv2.putText(display_frame, f"GUJARAT POLICE • CAM #{cam_id} ({city.upper()})", (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (56, 189, 248), 2)
        live_tag = "LIVE • ACTIVE" if self.is_active else "STANDBY"
        tag_color = (52, 211, 153) if self.is_active else (250, 204, 21)
        cv2.putText(display_frame, f"{time.strftime('%H:%M:%S')} | {live_tag}", (w - 180, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.38, tag_color, 1)

        cv2.rectangle(display_frame, (10, h - 30), (w - 10, h - 10), (10, 15, 26), -1)
        cv2.putText(display_frame, f"NODE: {junction} | AI ANPR & VAHAN: READY", (16, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (250, 204, 21), 1)

        # Ultra-fast JPEG encoding (65% quality produces crisp video with minimal bandwidth)
        ret, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 65])
        if ret:
            return buffer.tobytes()
        return None

    def release(self):
        self.running = False
        self._stop_pending = True

def get_master_engine():
    global _global_camera
    with _camera_lock:
        if _global_camera is None:
            _global_camera = MasterStreamEngine(CURRENT_STREAM_SOURCE, active=IS_CAMERA_ACTIVE)
        return _global_camera

async def generate_video_stream(cam_id: str = "cam01", city: str = "Ahmedabad", junction: str = "Sentinel Grid"):
    """
    Stream ultra-smooth, jitter-free video with zero freeze to browser clients asynchronously.
    Non-blocking generator ensures FastAPI event loop stays completely free for API requests.
    """
    import asyncio
    engine = get_master_engine()
    
    try:
        while True:
            frame_bytes = engine.get_jpeg_frame(cam_id=cam_id, city=city, junction=junction)
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            await asyncio.sleep(0.033)
    except (GeneratorExit, asyncio.CancelledError, Exception):
        pass