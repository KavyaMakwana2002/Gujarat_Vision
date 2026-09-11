import collections
import datetime
import time
import math
import cv2
import threading
import gc
from src.detection.detector import SentinelDetector, generate_rto_plate, generate_unique_detection_id
from src.alerts.mailer import send_echallan_email

SPEED_VIOLATIONS_LOG = collections.deque(maxlen=100)
_TOTAL_VIOLATIONS = 0

def get_speed_violations_log(limit: int = 50):
    return list(SPEED_VIOLATIONS_LOG)[:limit]

class SpeedEnforcementDetector(SentinelDetector):
    """
    Specialized Detector for Speed Enforcement & ANPR.
    Calculates speed using two virtual lines (Line 1 and Line 2).
    Dispatches automated E-Challans if speed > SPEED_LIMIT.
    """
    def __init__(self, speed_limit: float = 60.0):
        super().__init__()
        self.speed_limit = speed_limit
        
        # Line configurations (Y-coordinates for horizontal lines)
        self.line1_y = 250
        self.line2_y = 350
        self.distance_meters = 15.0 # Assume 15 meters between lines
        
        # Track entry times
        self.track_entry_times = {} # track_id -> (timestamp_crossed_line1, crossed_line2_flag)
        self.tracked_speeds = {} # track_id -> speed_kmh
        self.challaned_tracks = set()

    def detect_speed_and_anpr(self, frame, camera_id="SPEED-CAM-01", location_name="Highway Interceptor"):
        """Run YOLOv8 tracking, line crossing detection, and ANPR on violator."""
        self.frame_counter += 1
        current_time = time.time()

        if self.frame_counter % 30 == 0:
            self._cleanup_stale_tracks(current_time, ttl_seconds=10.0)

        model = self._get_model()
        anpr = self._get_anpr()
        
        h_img, w_img = frame.shape[:2]
        
        # Draw virtual lines
        cv2.line(frame, (0, self.line1_y), (w_img, self.line1_y), (0, 255, 255), 2)
        cv2.putText(frame, "LINE 1 (ENTRY)", (10, self.line1_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
        
        cv2.line(frame, (0, self.line2_y), (w_img, self.line2_y), (0, 165, 255), 2)
        cv2.putText(frame, "LINE 2 (EXIT)", (10, self.line2_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

        with self.inference_lock:
            results = model.track(frame, persist=True, tracker="bytetrack.yaml", verbose=False, conf=0.25, iou=0.45, imgsz=480)
        
        for r in results:
            boxes = r.boxes
            track_ids = boxes.id if boxes.id is not None else range(1, len(boxes.xyxy) + 1)
            
            for box, track_id, cls, conf_val in zip(boxes.xyxy, track_ids, boxes.cls, boxes.conf):
                x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                track_id = int(track_id)
                cls = int(cls)
                class_name = model.names[cls] if cls in model.names else "vehicle"
                
                self.track_last_seen[track_id] = current_time

                # Only track vehicles for speed
                if class_name in ['car', 'motorcycle', 'bus', 'truck']:
                    cy = int((y1 + y2) / 2) # Center Y of bounding box
                    cx = int((x1 + x2) / 2) # Center X
                    
                    # Aspect ratio heuristic
                    w_box = x2 - x1
                    h_box = y2 - y1
                    display_name = "CAR"
                    if class_name == 'motorcycle': display_name = "BIKE"
                    elif class_name == 'bus': display_name = "BUS"
                    elif class_name == 'truck': display_name = "TRUCK"
                    else:
                        if 0.70 <= (w_box / max(1, h_box)) <= 1.35 and 2500 < (w_box * h_box) < 35000:
                            display_name = "AUTO"

                    # 1. Line Crossing Logic
                    if track_id not in self.track_entry_times:
                        # Crossed Line 1 going down
                        if cy >= self.line1_y and cy < self.line2_y:
                            self.track_entry_times[track_id] = {"t1": current_time, "crossed_l2": False}
                    else:
                        t1 = self.track_entry_times[track_id]["t1"]
                        crossed_l2 = self.track_entry_times[track_id]["crossed_l2"]
                        
                        # Crossed Line 2 going down
                        if cy >= self.line2_y and not crossed_l2:
                            t2 = current_time
                            self.track_entry_times[track_id]["crossed_l2"] = True
                            
                            time_diff = t2 - t1
                            if time_diff > 0:
                                speed_ms = self.distance_meters / time_diff
                                speed_kmh = speed_ms * 3.6
                                self.tracked_speeds[track_id] = round(speed_kmh, 1)

                    speed_kmh = self.tracked_speeds.get(track_id, 0.0)
                    
                    # Base Box Color
                    box_color = (0, 255, 0) if speed_kmh <= self.speed_limit else (0, 0, 255)
                    if speed_kmh == 0.0: box_color = (255, 255, 0) # Calculating...
                    
                    # 2. Extract Plate using ANPR if speeding
                    plate_text = self.tracked_plates.get(track_id, None)
                    if speed_kmh > self.speed_limit and not plate_text and (self.frame_counter % 10 == 0):
                        car_crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
                        if car_crop.size != 0:
                            extracted = anpr.read_plate(car_crop)
                            if extracted:
                                plate_text = extracted
                                self.tracked_plates[track_id] = plate_text
                    
                    # Fallback plate generation for demo if OCR misses
                    effective_plate = plate_text if plate_text else generate_rto_plate(city=location_name, track_id=track_id, vehicle_type=display_name)
                    
                    # 3. Dispatch E-Challan Alert
                    if speed_kmh > self.speed_limit and track_id not in self.challaned_tracks:
                        global _TOTAL_VIOLATIONS
                        self.challaned_tracks.add(track_id)
                        _TOTAL_VIOLATIONS += 1
                        
                        # Push to violation log
                        violation_record = {
                            "id": generate_unique_detection_id(track_id),
                            "vehicle_type": display_name,
                            "plate_number": effective_plate,
                            "speed": speed_kmh,
                            "limit": self.speed_limit,
                            "timestamp": datetime.datetime.utcnow().isoformat(),
                            "location": location_name,
                            "camera_id": camera_id
                        }
                        SPEED_VIOLATIONS_LOG.appendleft(violation_record)
                        
                        # Trigger email async
                        threading.Thread(target=send_echallan_email, args=(
                            effective_plate, speed_kmh, location_name, display_name, violation_record["timestamp"], "kavyamak11@gmail.com"
                        ), daemon=True).start()

                    # 4. Draw HUD
                    label = f"{display_name} [{effective_plate}]"
                    if speed_kmh > 0:
                        speed_lbl = f"{speed_kmh} KM/H"
                        cv2.putText(frame, speed_lbl, (x1, max(20, y1 - 35)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)
                        
                    cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                    cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + (len(label) * 9), y1), box_color, -1)
                    cv2.putText(frame, label, (x1 + 3, max(14, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 2)

        return frame
