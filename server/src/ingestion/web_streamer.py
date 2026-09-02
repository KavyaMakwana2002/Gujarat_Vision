import cv2
import time
import os
import threading
import numpy as np

# Global shared camera and detector instances
_detector_instance = None
_global_camera = None
_camera_lock = threading.Lock()
CURRENT_STREAM_SOURCE = "standby" # Camera in standby until user explicitly starts it
IS_CAMERA_ACTIVE = False

def get_detector():
    global _detector_instance
    if _detector_instance is None:
        from src.detection.detector import SentinelDetector
        _detector_instance = SentinelDetector()
    return _detector_instance

def start_camera(source=0):
    """Explicitly activate camera hardware and begin video capture."""
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE, _global_camera
    with _camera_lock:
        if str(source).lower() in ["webcam", "0", "cam"]:
            CURRENT_STREAM_SOURCE = 0
        elif isinstance(source, str) and source.isdigit():
            CURRENT_STREAM_SOURCE = int(source)
        else:
            CURRENT_STREAM_SOURCE = source
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
    """Set dynamic RTSP URL, Video file path, or Webcam ID."""
    global CURRENT_STREAM_SOURCE, IS_CAMERA_ACTIVE, _global_camera
    with _camera_lock:
        if str(source).lower() in ["webcam", "0", "cam"]:
            CURRENT_STREAM_SOURCE = 0
        elif isinstance(source, str) and source.isdigit():
            CURRENT_STREAM_SOURCE = int(source)
        else:
            CURRENT_STREAM_SOURCE = source
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
    """
    def __init__(self, src="standby", active=False):
        self.src = src
        self.is_active = active
        self.cap = None
        self.running = True
        self.lock = threading.Lock()
        
        self.raw_frame = None
        self.annotated_frame = None
        self.cached_jpeg = None
        
        self.detector = None
        self.latest_boxes = []
        
        if self.is_active and self.src != "standby":
            self._init_capture()
        
        # Thread 1: Hardware Frame Ingestion (30-60 FPS)
        self.capture_thread = threading.Thread(target=self._capture_worker, daemon=True)
        self.capture_thread.start()
        
        # Thread 2: Asynchronous AI Inference (YOLOv8 + ANPR Worker)
        self.ai_thread = threading.Thread(target=self._ai_worker, daemon=True)
        self.ai_thread.start()

    def _init_capture(self):
        try:
            if not self.is_active or self.src == "standby":
                return

            if isinstance(self.src, int) or str(self.src) == "0":
                self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                if not self.cap or not self.cap.isOpened():
                    self.cap = cv2.VideoCapture(0)
            else:
                self.cap = cv2.VideoCapture(self.src)

            if self.cap and self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                self.cap.set(cv2.CAP_PROP_FPS, 30)
                print("[+] Hardware VideoCapture device successfully opened.")
        except Exception as e:
            print(f"[-] Capture Init Warning: {e}")

    def start(self, new_src=0):
        with self.lock:
            self.src = new_src
            self.is_active = True
            if self.cap and self.cap.isOpened():
                self.cap.release()
            self._init_capture()

    def stop(self):
        with self.lock:
            self.is_active = False
            self.src = "standby"
            if self.cap:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
            self.raw_frame = None
            self.annotated_frame = None

    def _capture_worker(self):
        """Dedicated thread continuously pulling fresh frames at maximum hardware speed."""
        while self.running:
            if self.is_active and self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    with self.lock:
                        self.raw_frame = frame
                else:
                    time.sleep(0.01)
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
                    # Run lightweight detector on downscaled frame for high throughput
                    processed = self.detector.detect_objects(
                        frame_to_process, 
                        camera_id="CAM-LIVE", 
                        location_name="Gujarat Surveillance Center"
                    )
                    with self.lock:
                        self.annotated_frame = processed
                except Exception:
                    pass
                time.sleep(0.02)
            else:
                time.sleep(0.03)

    def get_jpeg_frame(self, cam_id=1, city="Ahmedabad", junction="SG Highway"):
        """Get ultra-smooth, freshly rendered JPEG frame with zero delay."""
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
            cv2.putText(display_frame, "SURVEILLANCE CAMERA IN STANDBY", (145, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (250, 204, 21), 2)
            
            status_desc = "HARDWARE CAMERA IS CURRENTLY OFF" if not self.is_active else "CONNECTING TO CAMERA..."
            cv2.putText(display_frame, status_desc, (170, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1)
            cv2.putText(display_frame, "Click 'Start Camera' on dashboard to begin live AI tracking", (90, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (52, 211, 153), 1)
            cv2.putText(display_frame, f"Node: {junction} ({city.upper()}) | Camera #{cam_id}", (150, 370), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 116, 139), 1)

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
        self.stop()

def get_master_engine():
    global _global_camera
    with _camera_lock:
        if _global_camera is None:
            _global_camera = MasterStreamEngine(CURRENT_STREAM_SOURCE, active=IS_CAMERA_ACTIVE)
        return _global_camera

def generate_video_stream(cam_id: int = 1, city: str = "Ahmedabad", junction: str = "SG Highway Junction"):
    """
    Stream ultra-smooth, jitter-free video with zero freeze to browser clients.
    """
    engine = get_master_engine()
    
    while True:
        frame_bytes = engine.get_jpeg_frame(cam_id=cam_id, city=city, junction=junction)
        if frame_bytes:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)
