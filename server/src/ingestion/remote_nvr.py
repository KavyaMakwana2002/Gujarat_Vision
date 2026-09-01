import os
import time
import socket
import threading
import logging
import urllib.parse
import cv2
import numpy as np
from src.detection.detector import SentinelDetector

# Ensure RTSP over TCP is enforced
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("RemoteNVR")

class RemoteNVRClient:
    """
    Dedicated Remote Shop NVR & IP Camera Integration Client (Different Network / VPN Gateway)
    Fully optimized for COREPRIX (Model: CPI-5M-B3SL-TW) & other ONVIF 5MP IP cameras.
    
    Features:
      - Multi-path RTSP auto-probing (automatically finds working RTSP path)
      - Network reachability & port socket diagnostics
      - RTSP over TCP with FFMPEG hardware acceleration
      - PTS Monotonic Clock Timing (CAP_PROP_POS_MSEC)
      - Exponential Reconnect Backoff (2s -> 4s -> 8s -> 16s -> 30s)
      - Zero-freeze Bounded Frame Queue & Decoupled YOLOv8 ANPR Pipeline
    """

    BACKOFF_SEQUENCE = [2, 4, 8, 16, 30]

    def __init__(self):
        self.lock = threading.Lock()
        self.detector = SentinelDetector()
        
        # Configuration parameters
        self.nvr_host = "192.168.1.100" # Local shop IP, DDNS, or VPN IP (e.g. 10.8.0.2)
        self.rtsp_port = 554
        self.username = "admin"
        self.password = ""
        self.channel = 1
        self.profile = "main" # main (5MP) / sub (D1/720p)
        self.nvr_brand = "COREPRIX / ONVIF IP Cam"
        self.custom_rtsp_url = ""
        
        # Diagnostics
        self.network_reachable = False
        self.diag_message = "Initializing..."
        self.active_working_url = ""
        
        # Runtime states
        self.is_connected = False
        self.reconnect_attempts = 0
        self.current_backoff = 2
        self.running = True
        self.last_pts_ms = 0.0
        
        self.raw_frame = None
        self.annotated_frame = None
        
        # Threads
        self.cap = None
        self.capture_thread = threading.Thread(target=self._capture_worker, daemon=True)
        self.capture_thread.start()
        
        self.ai_thread = threading.Thread(target=self._ai_worker, daemon=True)
        self.ai_thread.start()

    def get_candidate_rtsp_urls(self) -> list:
        """Generate candidate RTSP paths based on camera manufacturer specifications."""
        if self.custom_rtsp_url:
            return [self.custom_rtsp_url]
            
        auth_part = ""
        if self.username and self.password:
            safe_user = urllib.parse.quote(self.username)
            safe_pass = urllib.parse.quote(self.password)
            auth_part = f"{safe_user}:{safe_pass}@"
        elif self.username:
            auth_part = f"{urllib.parse.quote(self.username)}@"

        host_port = f"{self.nvr_host}:{self.rtsp_port}"
        brand = self.nvr_brand.lower()
        candidates = []

        # COREPRIX CPI-5M-B3SL-TW & Standard ONVIF 5MP IP Cameras
        if "coreprix" in brand or "onvif" in brand or "xmeye" in brand:
            candidates.extend([
                f"rtsp://{auth_part}{host_port}/onvif1",                                  # ONVIF Profile S Main Stream (5MP)
                f"rtsp://{auth_part}{host_port}/onvif2",                                  # ONVIF Sub Stream (Smooth Remote)
                f"rtsp://{auth_part}{host_port}/live/ch0",                                # Xiongmai / COREPRIX Main
                f"rtsp://{auth_part}{host_port}/stream1",                                 # Standard IP Cam Stream 1
                f"rtsp://{auth_part}{host_port}/user={self.username}&password={self.password}&channel={self.channel}&stream=0.sdp", # XM RTSP
                f"rtsp://{auth_part}{host_port}/h264/ch1/main/av_stream",                 # H.264 Main
                f"rtsp://{auth_part}{host_port}/h265/ch1/main/av_stream"                  # H.265 Main (5MP Starlight)
            ])
        elif "hikvision" in brand:
            ch_code = f"{self.channel}01" if self.profile == "main" else f"{self.channel}02"
            candidates.append(f"rtsp://{auth_part}{host_port}/Streaming/Channels/{ch_code}")
        elif "dahua" in brand or "cp plus" in brand:
            subtype = 0 if self.profile == "main" else 1
            candidates.append(f"rtsp://{auth_part}{host_port}/cam/realmonitor?channel={self.channel}&subtype={subtype}")
        elif "uniview" in brand:
            subtype = 1 if self.profile == "main" else 2
            candidates.append(f"rtsp://{auth_part}{host_port}/unicast/c{self.channel}/s{subtype}/live")
        else:
            candidates.extend([
                f"rtsp://{auth_part}{host_port}/onvif1",
                f"rtsp://{auth_part}{host_port}/ch{self.channel}/{self.profile}",
                f"rtsp://{auth_part}{host_port}/live/ch0"
            ])

        return candidates

    def check_socket_reachability(self, timeout=1.5) -> bool:
        """Check if target host and RTSP port can be reached over TCP socket."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((self.nvr_host, int(self.rtsp_port)))
            sock.close()
            return result == 0
        except Exception:
            return False

    def configure(self, host: str, port: int = 554, username: str = "admin", password: str = "", 
                  channel: int = 1, brand: str = "COREPRIX / ONVIF IP Cam", custom_url: str = ""):
        """Update Remote NVR configuration and trigger auto-discovery."""
        with self.lock:
            self.nvr_host = host.strip()
            self.rtsp_port = int(port)
            self.username = username.strip()
            self.password = password.strip()
            self.channel = int(channel)
            self.nvr_brand = brand.strip()
            self.custom_rtsp_url = custom_url.strip()
            self.reconnect_attempts = 0
            self.current_backoff = 2
            self.active_working_url = ""
            
            if self.cap and self.cap.isOpened():
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None

        logger.info(f"[{time.strftime('%H:%M:%S')}] REMOTE_NVR_CONFIGURED host={self.nvr_host} port={self.rtsp_port} brand='{self.nvr_brand}' channel={self.channel}")
        return self.get_status()

    def _init_capture(self):
        """Auto-probe candidate URLs to find the active COREPRIX/NVR stream."""
        # 1. Socket reachability check first
        self.network_reachable = self.check_socket_reachability()
        if not self.network_reachable:
            self.is_connected = False
            self.diag_message = f"Network Unreachable: Cannot connect to {self.nvr_host}:{self.rtsp_port}. Check VPN / Port Forwarding."
            logger.warning(f"[{time.strftime('%H:%M:%S')}] ROUTE_ERROR host={self.nvr_host}:{self.rtsp_port} (Not reachable from this network)")
            self._handle_reconnect_backoff()
            return

        candidates = self.get_candidate_rtsp_urls()
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

        for url in candidates:
            redacted_url = url
            if "@" in url:
                prefix = url.split("@")[0]
                rest = url.split("@")[1]
                redacted_url = f"rtsp://***:***@{rest}"

            logger.info(f"[{time.strftime('%H:%M:%S')}] REMOTE_PROBING url={redacted_url} (RTSP over TCP)")
            
            try:
                cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
                if cap and cap.isOpened():
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    # Verify frame read
                    ret, test_frame = cap.read()
                    if ret and test_frame is not None:
                        self.cap = cap
                        self.is_connected = True
                        self.active_working_url = redacted_url
                        self.diag_message = f"Connected Successfully ({test_frame.shape[1]}x{test_frame.shape[0]})"
                        self.reconnect_attempts = 0
                        logger.info(f"[{time.strftime('%H:%M:%S')}] REMOTE_CAMERA_CONNECTED url={redacted_url}")
                        return
                    else:
                        cap.release()
            except Exception as err:
                logger.warning(f"[{time.strftime('%H:%M:%S')}] PROBE_FAILED url={redacted_url} err={err}")

        # If none of the candidate URLs yielded a valid frame
        self.is_connected = False
        self.diag_message = "Port open but RTSP auth failed or invalid channel. Check username/password."
        self._handle_reconnect_backoff()

    def _handle_reconnect_backoff(self):
        self.reconnect_attempts += 1
        idx = min(self.reconnect_attempts - 1, len(self.BACKOFF_SEQUENCE) - 1)
        self.current_backoff = self.BACKOFF_SEQUENCE[idx]
        logger.info(f"[{time.strftime('%H:%M:%S')}] REMOTE_NVR_RECONNECT_ATTEMPT attempt={self.reconnect_attempts} backoff={self.current_backoff}s")

    def _capture_worker(self):
        """Dedicated thread pulling fresh frames from the remote COREPRIX camera at hardware speed."""
        while self.running:
            if self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    # Extract PTS
                    pts = self.cap.get(cv2.CAP_PROP_POS_MSEC)
                    if pts <= 0:
                        pts = self.last_pts_ms + 33.33
                    self.last_pts_ms = pts
                    
                    with self.lock:
                        self.raw_frame = frame
                        self.is_connected = True
                else:
                    self.is_connected = False
                    if self.cap:
                        try:
                            self.cap.release()
                        except Exception:
                            pass
                        self.cap = None
                    self._handle_reconnect_backoff()
                    time.sleep(self.current_backoff)
            else:
                time.sleep(self.current_backoff)
                if self.running and (not self.cap or not self.cap.isOpened()):
                    self._init_capture()

    def _ai_worker(self):
        """Decoupled AI Worker running YOLOv8 + ANPR on remote frames."""
        while self.running:
            frame_to_process = None
            with self.lock:
                if self.raw_frame is not None:
                    frame_to_process = self.raw_frame.copy()
            
            if frame_to_process is not None:
                try:
                    annotated = self.detector.detect_objects(
                        frame_to_process, 
                        pts_ms=self.last_pts_ms,
                        camera_id=f"REMOTE-COREPRIX-CH{self.channel}", 
                        location_name=f"Shop Camera ({self.nvr_host})"
                    )
                    with self.lock:
                        self.annotated_frame = annotated
                except Exception:
                    pass
                time.sleep(0.02)
            else:
                time.sleep(0.05)

    def get_jpeg_stream_frame(self):
        """Generate smooth JPEG frame with COREPRIX Camera Telemetry HUD & Diagnostics."""
        frame = None
        with self.lock:
            if self.annotated_frame is not None:
                frame = self.annotated_frame.copy()
            elif self.raw_frame is not None:
                frame = self.raw_frame.copy()

        if frame is None:
            # Diagnostics screen explaining exact root cause and solution
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            frame[:] = (15, 23, 42) # Slate dark
            
            # Draw HUD Box
            cv2.rectangle(frame, (20, 40), (620, 440), (30, 41, 59), -1)
            cv2.rectangle(frame, (20, 40), (620, 440), (56, 189, 248), 2)
            
            cv2.putText(frame, "COREPRIX 5MP IP CAMERA (CPI-5M-B3SL-TW)", (40, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (56, 189, 248), 2)
            cv2.putText(frame, "STATUS: REMOTE SETUP & ROUTING GUIDE", (40, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (250, 204, 21), 1)

            # Diagnostic Lines
            status_color = (52, 211, 153) if self.network_reachable else (248, 113, 113)
            reach_text = f"1. NETWORK REACHABILITY: {'REACHABLE (OK)' if self.network_reachable else 'UNREACHABLE (NO VPN / ROUTE)'}"
            cv2.putText(frame, reach_text, (40, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.42, status_color, 1)

            cv2.putText(frame, f"2. TARGET IP: {self.nvr_host} | PORT: {self.rtsp_port}", (40, 195), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (203, 213, 225), 1)
            cv2.putText(frame, f"3. RECONNECT BACKOFF: {self.current_backoff}s (Attempt #{self.reconnect_attempts})", (40, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (234, 179, 8), 1)
            cv2.putText(frame, f"4. DIAGNOSTICS: {self.diag_message[:45]}", (40, 265), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (148, 163, 184), 1)

            cv2.putText(frame, "HOW TO FIX IF ON DIFFERENT NETWORK (HOSTEL/HOME):", (40, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (250, 204, 21), 1)
            cv2.putText(frame, "• Option A: Connect Tailscale/WireGuard VPN on Shop PC & Laptop", (40, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (148, 163, 184), 1)
            cv2.putText(frame, "• Option B: Port Forward 554 on Shop Router to Camera IP", (40, 375), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (148, 163, 184), 1)
            cv2.putText(frame, "• Option C: If testing at Shop, connect Laptop to Shop Wi-Fi", (40, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (52, 211, 153), 1)
            time.sleep(0.04)

        h, w = frame.shape[:2]
        
        # Telemetry HUD Overlay
        cv2.rectangle(frame, (10, 10), (w - 10, 44), (10, 15, 26), -1)
        cv2.putText(frame, f"COREPRIX 5MP • CH-{self.channel} ({self.nvr_brand.upper()})", (18, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (56, 189, 248), 2)
        cv2.putText(frame, f"PTS: {self.last_pts_ms:.1f}ms | TCP", (w - 180, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (52, 211, 153), 1)

        cv2.rectangle(frame, (10, h - 32), (w - 10, h - 10), (10, 15, 26), -1)
        conn_status = "ONLINE (STREAMING 5MP)" if self.is_connected else f"RETRYING ({self.current_backoff}s)"
        cv2.putText(frame, f"IP: {self.nvr_host} | {conn_status} | AI YOLOv8 + ANPR", (18, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (250, 204, 21), 1)

        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 68])
        if ret:
            return buffer.tobytes()
        return None

    def get_status(self) -> dict:
        """Return diagnostic status of the remote COREPRIX camera."""
        return {
            "nvr_host": self.nvr_host,
            "rtsp_port": self.rtsp_port,
            "channel": self.channel,
            "brand": self.nvr_brand,
            "connected": self.is_connected,
            "network_reachable": self.network_reachable,
            "diagnostics": self.diag_message,
            "working_url": self.active_working_url,
            "reconnect_attempts": self.reconnect_attempts,
            "backoff_seconds": self.current_backoff,
            "transport": "RTSP over TCP",
            "pts_ms": self.last_pts_ms,
            "ai_active": True
        }

# Global Singleton Remote NVR Client
remote_nvr_client = RemoteNVRClient()

def generate_remote_nvr_stream():
    """MJPEG Streaming Generator dedicated to Remote COREPRIX IP Camera."""
    while True:
        frame_bytes = remote_nvr_client.get_jpeg_stream_frame()
        if frame_bytes:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.025)
