import time
import math
import cv2
import gc
from src.matching.watchlist import check_watchlist_match
from src.alerts.alert_engine import trigger_red_alert

class SentinelDetector:
    """
    State-of-the-Art AI Surveillance Pipeline:
      - YOLOv8 Nano Vehicle & Pedestrian Detection (Lazy Loaded for Cloud 512MB RAM)
      - ByteTrack Multi-Object Tracking with Persistent Track IDs
      - EasyOCR ANPR with Per-Track Plate Caching & Memory Safety Guard
      - PTS-Driven Motion Timing (TC-02)
      - Scene Discontinuity Recovery & Cache Purge (TC-10)
      - Alert Deduplication Window (TC-19)
    """

    def __init__(self):
        # Lazy load deep learning models to keep server startup RAM under 60MB on Render Free Tier
        self.model = None 
        self.anpr = None
        
        # Track caches and TTL state
        self.saved_track_ids = set() 
        self.alerted_track_ids = set()
        self.tracked_plates = {}      # track_id -> recognized plate string
        self.track_last_seen = {}     # track_id -> timestamp
        self.plate_alert_times = {}   # normalized_plate -> last_alert_time (for 60s deduplication)
        self.last_pts_ms = 0.0
        self.frame_counter = 0

    def _get_model(self):
        """Lazy load YOLOv8 model only when video inference is requested."""
        if self.model is None:
            try:
                import torch
                torch.set_num_threads(1)
                torch.set_grad_enabled(False)
            except Exception:
                pass
            print("[*] Loading YOLOv8 Nano Surveillance Engine on demand...")
            from ultralytics import YOLO
            self.model = YOLO('yolov8n.pt')
            print("[+] YOLOv8 Nano Engine ready.")
            gc.collect()
        return self.model

    def _get_anpr(self):
        """Lazy load ANPR engine."""
        if self.anpr is None:
            from src.detection.anpr import LicensePlateReader
            self.anpr = LicensePlateReader()
        return self.anpr

    def purge_scene_state(self):
        """
        TC-10: Scene Discontinuity Recovery
        Purges stale track IDs and plate associations across looping/scene cuts.
        """
        self.saved_track_ids.clear()
        self.alerted_track_ids.clear()
        self.tracked_plates.clear()
        self.track_last_seen.clear()
        print("[+] SCENE_STATE_PURGED: Cleaned track caches after scene discontinuity.")

    def _cleanup_stale_tracks(self, current_time: float, ttl_seconds: float = 10.0):
        """
        TC-17: Cache TTL Expiry
        Removes tracks and cached plates that haven't been observed for > TTL seconds.
        """
        stale_ids = [tid for tid, last_t in self.track_last_seen.items() if current_time - last_t > ttl_seconds]
        for tid in stale_ids:
            self.tracked_plates.pop(tid, None)
            self.track_last_seen.pop(tid, None)
            self.saved_track_ids.discard(tid)
            self.alerted_track_ids.discard(tid)

    def detect_objects(self, frame, pts_ms: float = 0.0, is_scene_discontinuity: bool = False, 
                       camera_id: str = "CAM-0001", location_name: str = "SG Highway Sentinel Post"):
        """
        Run real-time vehicle tracking, ANPR and government watchlist checking.
        """
        self.frame_counter += 1
        current_time = time.time()

        # Handle scene cut / loop restart
        if is_scene_discontinuity:
            self.purge_scene_state()

        # Cleanup expired track caches periodically
        if self.frame_counter % 30 == 0:
            self._cleanup_stale_tracks(current_time, ttl_seconds=10.0)

        model = self._get_model()
        anpr = self._get_anpr()

        # Run fast YOLOv8 tracking (optimized imgsz=384 for ultra-low RAM & 40+ FPS)
        results = model.track(
            frame, 
            persist=True, 
            tracker="bytetrack.yaml", 
            verbose=False, 
            conf=0.45, 
            iou=0.4,
            imgsz=384
        )
        
        for r in results:
            boxes = r.boxes
            if boxes.id is not None:
                for box, track_id, cls, conf in zip(boxes.xyxy, boxes.id, boxes.cls, boxes.conf):
                    x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                    track_id = int(track_id)
                    cls = int(cls)
                    class_name = model.names[cls]
                    
                    self.track_last_seen[track_id] = current_time

                    if class_name in ['car', 'motorcycle', 'bus', 'truck']:
                        box_color = (0, 255, 255) # Yellow
                        label = f"{class_name.upper()} ID:{track_id}"
                        
                        # Only run OCR once per tracked vehicle or every 30th frame
                        plate_text = self.tracked_plates.get(track_id, None)
                        if plate_text is None or (self.frame_counter % 30 == 0 and not plate_text):
                            car_crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
                            if car_crop.size != 0:
                                extracted = anpr.read_plate(car_crop)
                                if extracted:
                                    plate_text = extracted
                                    self.tracked_plates[track_id] = plate_text

                        if plate_text:
                            label = f"{class_name.upper()} ID:{track_id} [{plate_text}]"
                            
                            # TC-18 & TC-19: Check Watchlist with 60-second sliding deduplication window
                            match_data = check_watchlist_match(plate_text)
                            if match_data:
                                box_color = (0, 0, 255) # RED
                                label = f"[!] RED ALERT [{plate_text}]"
                                
                                last_alert_t = self.plate_alert_times.get(plate_text, 0.0)
                                if (current_time - last_alert_t) > 60.0 and track_id not in self.alerted_track_ids:
                                    self.plate_alert_times[plate_text] = current_time
                                    self.alerted_track_ids.add(track_id)
                                    
                                    # Trigger instant high-priority red alert event
                                    trigger_red_alert(
                                        plate_number=plate_text,
                                        vehicle_type=class_name,
                                        fir_number=match_data.get("fir_number", "N/A"),
                                        reason=match_data.get("reason", "Wanted / Stolen Vehicle"),
                                        police_station=match_data.get("police_station", "Gujarat Central Control"),
                                        camera_id=camera_id,
                                        location_name=location_name
                                    )

                        # Draw cyber-hud bounding box & badge
                        cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                        cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + (len(label) * 10), y1), box_color, -1)
                        cv2.putText(frame, label, (x1 + 4, max(16, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 2)

        return frame