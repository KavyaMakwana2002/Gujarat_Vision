import time
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
from .base_adapter import BaseVMSAdapter, VMSHealthStatus, VMSEvent

class CityPoliceVMSAdapter(BaseVMSAdapter):
    """
    Adapter for Gujarat Police Smart City Surveillance System (VMS Node 1).
    Aggregates urban junctions, ring roads, sensitive government installations,
    and urban ANPR checkpoints across Ahmedabad, Surat, Vadodara, and Rajkot.
    """

    def __init__(self):
        super().__init__(
            system_id="vms-node-01-gujpol",
            system_name="Gujarat Police Smart City VMS",
            department="Home Department (Gujarat Police)",
            vendor_type="Smart City Surveillance Grid (Milestone/HikCentral)",
            protocol="RTSP / ONVIF Profile S / REST API",
            endpoint="10.14.0.10:8080/api/v1"
        )
        self._cameras = [
            {"id": "cam01", "name": "Chiman bhai Bridge CCTV", "location": "Ahmedabad", "lat": 23.0725, "lng": 72.5855, "zone": "North Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam01"},
            {"id": "cam02", "name": "Janpath Road Surveillance", "location": "Ahmedabad", "lat": 23.0300, "lng": 72.5600, "zone": "West Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam02"},
            {"id": "cam03", "name": "O.N.G.C. Office Junction", "location": "Ahmedabad", "lat": 23.0550, "lng": 72.5950, "zone": "East Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam03"},
            {"id": "cam04", "name": "Paldi Circle High-Speed ANPR", "location": "Ahmedabad", "lat": 23.0125, "lng": 72.5625, "zone": "South Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam04"},
            {"id": "cam05", "name": "Visat teen Rasta Junction", "location": "Ahmedabad", "lat": 23.0900, "lng": 72.5800, "zone": "North Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam05"},
            {"id": "cam06", "name": "Timbavadi Gate Security Cam", "location": "Junagadh", "lat": 21.5222, "lng": 70.4579, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam06"},
            {"id": "cam07", "name": "Hero Showroom Junction", "location": "Gir Somnath", "lat": 20.9000, "lng": 70.3600, "zone": "Coastal Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam07"},
            {"id": "cam08", "name": "Majewadi Gate CCTV", "location": "Junagadh", "lat": 21.5300, "lng": 70.4600, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam08"},
            {"id": "cam09", "name": "New Bypass Circle Node 2", "location": "Junagadh", "lat": 21.5150, "lng": 70.4700, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam09"},
            {"id": "cam10", "name": "Char Chowk Road Node 2", "location": "Junagadh", "lat": 21.5200, "lng": 70.4650, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam10"},
            {"id": "cam11", "name": "Dolatpara Checkpoint", "location": "Junagadh", "lat": 21.5400, "lng": 70.4500, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam11"},
            {"id": "cam12", "name": "Tri Mandir Adalaj Tollnaka Checkpoint", "location": "Gandhinagar", "lat": 23.2350, "lng": 72.6350, "zone": "Capital Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam12"},
            {"id": "cam13", "name": "CN Vidhyalaya Road Cam", "location": "Ahmedabad", "lat": 23.0200, "lng": 72.5500, "zone": "West Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam13"},
            {"id": "cam14", "name": "Delight RLVD Traffic Node", "location": "Ahmedabad", "lat": 23.0400, "lng": 72.5700, "zone": "Central Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam14"},
            {"id": "cam15", "name": "Suvidha Park Surveillance", "location": "Ahmedabad", "lat": 23.0500, "lng": 72.5800, "zone": "East Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam15"},
            {"id": "cam16", "name": "Visat P2 Highway Link", "location": "Ahmedabad", "lat": 23.0950, "lng": 72.5850, "zone": "North Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam16"},
            {"id": "cam17", "name": "Rajkot Bus Port CCTV Node", "location": "Rajkot", "lat": 22.3039, "lng": 70.8022, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam17"},
            {"id": "cam18", "name": "Rajkot Central Junction", "location": "Rajkot", "lat": 22.2900, "lng": 70.7900, "zone": "Saurashtra Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam18"},
            {"id": "cam19", "name": "Khaparia Gram Panchayat CCTV", "location": "Navsari", "lat": 20.8500, "lng": 72.9200, "zone": "South Gujarat Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam19"},
            {"id": "cam20", "name": "Mohanpura Surveillance Node", "location": "Ahmedabad", "lat": 23.0350, "lng": 72.6000, "zone": "East Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam20"},
            {"id": "cam21", "name": "Patan Dethali Char Rasta", "location": "Patan", "lat": 23.8500, "lng": 72.1200, "zone": "North Gujarat Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam21"},
            {"id": "cam22", "name": "BK Mervada Tran Rasta", "location": "Banaskantha", "lat": 24.1700, "lng": 72.4300, "zone": "Border Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam22"},
            {"id": "cam23", "name": "Kheram Junction CCTV", "location": "Kheram", "lat": 22.7500, "lng": 71.5000, "zone": "Central Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam23"},
            {"id": "cam24", "name": "Dehgam Crossroads", "location": "Gandhinagar", "lat": 23.1700, "lng": 72.8200, "zone": "Capital Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam24"},
            {"id": "cam25", "name": "Dhanori Surveillance Node", "location": "Navsari", "lat": 20.8000, "lng": 72.9000, "zone": "South Gujarat Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam25"},
            {"id": "cam26", "name": "Tankal Security Checkpost", "location": "Navsari", "lat": 20.7800, "lng": 72.8800, "zone": "South Gujarat Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam26"},
            {"id": "cam27", "name": "Bilimora Port Link Node 1", "location": "Navsari", "lat": 20.7600, "lng": 72.9500, "zone": "Coastal Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam27"},
            {"id": "cam28", "name": "Bilimora Town Center Node 2", "location": "Navsari", "lat": 20.7550, "lng": 72.9550, "zone": "Coastal Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam28"},
            {"id": "cam29", "name": "Bilimora Highway Junction Node 3", "location": "Navsari", "lat": 20.7500, "lng": 72.9600, "zone": "Coastal Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam29"},
            {"id": "cam30", "name": "Gandhidham Rambaugh P2 Node", "location": "Kutch", "lat": 23.0800, "lng": 70.1300, "zone": "Kutch Border Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam30"}
        ]
        self.is_connected = True

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def disconnect(self) -> bool:
        self.is_connected = False
        return True

    def get_health(self) -> VMSHealthStatus:
        active_count = len(self._cameras)
        return VMSHealthStatus(
            is_online=self.is_connected,
            latency_ms=round(random.uniform(6.5, 14.2), 1),
            active_cameras=active_count,
            total_cameras=active_count,
            fps=25.0,
            packet_loss_percent=0.02,
            last_sync=datetime.utcnow().isoformat(),
            details={
                "core_version": "v4.2.1-PROD",
                "encryption": "TLS 1.3 / AES-256",
                "storage_pool": "NAS-AHMD-01 (78% free)"
            }
        )

    def fetch_cameras(self) -> List[Dict[str, Any]]:
        return self._cameras

    def get_stream_uri(self, camera_id: str) -> Optional[str]:
        for cam in self._cameras:
            if cam["id"] == camera_id:
                return cam["stream_url"]
        return None

    def fetch_recent_events(self, limit: int = 15) -> List[VMSEvent]:
        events = []
        plates = [
            ("GJ01AB1234", "Car", 0.94, True, "Stolen Vehicle (eGujCop Alert)"),
            ("GJ27CD5678", "SUV", 0.89, False, None),
            ("GJ06EE9900", "Truck", 0.92, True, "Overloaded / Blacklisted Target"),
            ("GJ03KK4411", "Motorcycle", 0.87, False, None),
            ("GJ05XX7788", "Sedan", 0.96, True, "Wanted Offender Vehicle"),
            ("GJ18BB3322", "Car", 0.91, False, None),
        ]
        
        for i, (plate, vclass, conf, hotlist, cat) in enumerate(plates[:limit]):
            cam = self._cameras[i % len(self._cameras)]
            events.append(VMSEvent(
                event_id=f"EVT-CITY-{int(time.time()) - (i * 120)}",
                source_system_id=self.system_id,
                source_system_name=self.system_name,
                camera_id=cam["id"],
                camera_location=f"{cam['name']} ({cam['location']})",
                gps_coordinates={"lat": cam["lat"], "lng": cam["lng"]},
                plate_number=plate,
                vehicle_class=vclass,
                confidence=conf,
                timestamp=datetime.utcfromtimestamp(time.time() - (i * 120)).isoformat(),
                is_hotlist_match=hotlist,
                hotlist_category=cat,
                raw_metadata={"zone": cam["zone"], "detector": "YOLOv8x + EasyOCR"}
            ))
        return events
