import time
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
from .base_adapter import BaseVMSAdapter, VMSHealthStatus, VMSEvent

class HighwayTollVMSAdapter(BaseVMSAdapter):
    """
    Adapter for NHAI & Gujarat State Highway Toll Surveillance (VMS Node 2).
    Integrates National Expressway 1 (NE-1 Ahmedabad-Vadodara), Golden Quadrilateral,
    FASTag ANPR gates, and Inter-District Highway Checkposts.
    """

    def __init__(self):
        super().__init__(
            system_id="vms-node-02-tollnhai",
            system_name="NHAI & Gujarat Highway Toll VMS",
            department="Road & Buildings / NHAI Division",
            vendor_type="High-Speed Highway Toll ANPR (Dahua DSS / FastTag SDK)",
            protocol="HTTP REST API / WebSockets / Webhook",
            endpoint="10.88.20.100:9000/api/v2"
        )
        self._cameras = [
            {"id": "toll-ne1-01", "name": "NE-1 Ahmedabad Toll Plaza Lane 4", "location": "Ahmedabad Outer", "lat": 22.9800, "lng": 72.6800, "zone": "Expressway Zone", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam12"},
            {"id": "toll-ne1-02", "name": "NE-1 Anand Interchange High-Speed ANPR", "location": "Anand Highway", "lat": 22.5645, "lng": 72.9289, "zone": "Central Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam05"},
            {"id": "toll-nh48-03", "name": "NH-48 Surat Kamrej Toll Barrier", "location": "Surat Highway", "lat": 21.2678, "lng": 72.9612, "zone": "Industrial Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam17"},
            {"id": "toll-nh27-04", "name": "NH-27 Rajkot Bamanbore Toll Plaza", "location": "Rajkot Highway", "lat": 22.3855, "lng": 71.0125, "zone": "Saurashtra Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam07"},
            {"id": "toll-sh10-05", "name": "SH-10 Tri Mandir Checkpoint Toll", "location": "Gandhinagar Outer", "lat": 23.2350, "lng": 72.6350, "zone": "Capital Corridor", "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam12"}
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
            latency_ms=round(random.uniform(9.0, 18.5), 1),
            active_cameras=active_count,
            total_cameras=active_count,
            fps=30.0,
            packet_loss_percent=0.01,
            last_sync=datetime.utcnow().isoformat(),
            details={
                "anpr_trigger": "Inductive Loop + Laser Scanner",
                "fastag_gateway": "NPCI NETC Direct v2.4 (Active)",
                "barrier_sync": "Automated Relay ON"
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
        # Notice: Plate GJ01AB1234 & GJ05XX7788 exist in both systems with time deltas for cross-correlation!
        toll_plates = [
            ("GJ01AB1234", "Car", 0.98, True, "Stolen Vehicle (eGujCop Alert)"),
            ("GJ05XX7788", "Sedan", 0.95, True, "Wanted Offender Vehicle"),
            ("GJ01HG7890", "Commercial Bus", 0.91, False, None),
            ("GJ12AZ9911", "Heavy Truck", 0.88, False, None),
            ("MH04AB9999", "SUV", 0.93, False, None),
            ("DL01CY4321", "Car", 0.90, False, None),
        ]
        
        for i, (plate, vclass, conf, hotlist, cat) in enumerate(toll_plates[:limit]):
            cam = self._cameras[i % len(self._cameras)]
            # Simulated 15-25 minutes earlier at toll plaza
            event_time = time.time() - (i * 180) - 900
            events.append(VMSEvent(
                event_id=f"EVT-TOLL-{int(event_time)}",
                source_system_id=self.system_id,
                source_system_name=self.system_name,
                camera_id=cam["id"],
                camera_location=f"{cam['name']} ({cam['location']})",
                gps_coordinates={"lat": cam["lat"], "lng": cam["lng"]},
                plate_number=plate,
                vehicle_class=vclass,
                confidence=conf,
                timestamp=datetime.utcfromtimestamp(event_time).isoformat(),
                is_hotlist_match=hotlist,
                hotlist_category=cat,
                raw_metadata={"toll_lane": f"Lane {i+1}", "fastag_id": f"FASTAG-GJ-0{i+1}984"}
            ))
        return events
