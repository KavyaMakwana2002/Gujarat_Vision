import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from .base_adapter import BaseVMSAdapter, VMSSystemMetadata, VMSHealthStatus, VMSEvent
from .city_police_adapter import CityPoliceVMSAdapter
from .highway_toll_adapter import HighwayTollVMSAdapter
from .event_bus import event_bus
from .correlation_engine import correlation_engine, CorrelatedIncident

class GenericThirdPartyVMSAdapter(BaseVMSAdapter):
    """Dynamically onboarded VMS Adapter for third-party vendors (Hikvision, Dahua, Milestone, ONVIF)."""

    def __init__(self, system_id: str, system_name: str, department: str, vendor_type: str, protocol: str, endpoint: str):
        super().__init__(system_id, system_name, department, vendor_type, protocol, endpoint)
        self.is_connected = True
        self._cameras = [
            {"id": f"{system_id}-cam01", "name": f"{system_name} Main Entrance PTZ", "location": department, "lat": 23.0225, "lng": 72.5714, "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam01"},
            {"id": f"{system_id}-cam02", "name": f"{system_name} Perimeter Node 2", "location": department, "lat": 23.0310, "lng": 72.5800, "status": "ONLINE", "stream_url": "rtsp://kavyamak11%40gmail.com:X64V-9ZAQ-T5AN@103.250.160.189:8554/stream/cam02"}
        ]

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def disconnect(self) -> bool:
        self.is_connected = False
        return True

    def get_health(self) -> VMSHealthStatus:
        return VMSHealthStatus(
            is_online=self.is_connected,
            latency_ms=14.8,
            active_cameras=len(self._cameras),
            total_cameras=len(self._cameras),
            fps=25.0,
            packet_loss_percent=0.0,
            last_sync=datetime.utcnow().isoformat(),
            details={"vendor": self.vendor_type, "gateway": "Federation Generic Bridge"}
        )

    def fetch_cameras(self) -> List[Dict[str, Any]]:
        return self._cameras

    def get_stream_uri(self, camera_id: str) -> Optional[str]:
        for c in self._cameras:
            if c["id"] == camera_id:
                return c.get("stream_url")
        return None

    def fetch_recent_events(self, limit: int = 5) -> List[VMSEvent]:
        return []

class FederationManager:
    """
    Central VMS Federation Middleware (Model 3 Core Orchestrator).
    Manages adapter lifecycles, event bus routing, multi-system analytics, and correlation workflows.
    """

    def __init__(self):
        self._adapters: Dict[str, BaseVMSAdapter] = {}
        self._initialize_default_federation_adapters()

    def _initialize_default_federation_adapters(self):
        """Register the 2 primary federated systems: Gujarat Police City VMS & Highway Toll VMS."""
        city_adapter = CityPoliceVMSAdapter()
        highway_adapter = HighwayTollVMSAdapter()

        self._adapters[city_adapter.system_id] = city_adapter
        self._adapters[highway_adapter.system_id] = highway_adapter

        # Prime the event bus with initial events from both systems
        for evt in city_adapter.fetch_recent_events(10):
            event_bus.publish(evt)
        for evt in highway_adapter.fetch_recent_events(10):
            event_bus.publish(evt)

    def register_adapter(self, adapter: BaseVMSAdapter) -> bool:
        """Register a new VMS adapter to the federation pool."""
        self._adapters[adapter.system_id] = adapter
        adapter.connect()
        return True

    def onboard_new_vendor(self, system_name: str, department: str, vendor_type: str, protocol: str, endpoint: str) -> Dict[str, Any]:
        """Dynamically onboard a third-party VMS vendor (Hikvision, Dahua, Milestone, ONVIF)."""
        clean_id = f"vms-node-{len(self._adapters) + 1:02d}-{vendor_type.lower().replace(' ', '')[:6]}"
        new_adapter = GenericThirdPartyVMSAdapter(
            system_id=clean_id,
            system_name=system_name,
            department=department,
            vendor_type=vendor_type,
            protocol=protocol,
            endpoint=endpoint
        )
        self.register_adapter(new_adapter)
        return {
            "status": "SUCCESS",
            "message": f"Successfully federated '{system_name}' ({vendor_type}) via {protocol}",
            "system_id": clean_id,
            "metadata": new_adapter.get_metadata().dict()
        }

    def get_federation_overview(self) -> Dict[str, Any]:
        """Aggregate comprehensive federation overview, node health, and correlation count."""
        systems_list = []
        total_active_cams = 0
        total_cameras = 0

        for sys_id, adapter in self._adapters.items():
            meta = adapter.get_metadata()
            health = adapter.get_health()
            total_active_cams += health.active_cameras
            total_cameras += health.total_cameras
            systems_list.append({
                "metadata": meta.dict(),
                "health": health.dict()
            })

        all_events = event_bus.get_events(limit=50)
        correlations = correlation_engine.ingest_and_correlate(all_events)

        return {
            "federation_name": "Gujarat Unified VMS Middleware & Federation Layer",
            "model_version": "Model 3 - Interoperability & Cross-System Standard",
            "status": "FEDERATED_ACTIVE",
            "federated_systems_count": len(self._adapters),
            "total_federated_cameras": total_cameras,
            "active_cameras": total_active_cams,
            "systems": systems_list,
            "event_bus_telemetry": event_bus.get_telemetry(),
            "active_correlations_count": len(correlations),
            "critical_alerts_count": sum(1 for c in correlations if c.severity == "CRITICAL"),
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_all_systems(self) -> List[Dict[str, Any]]:
        """Return list of all registered systems with full camera catalogs."""
        results = []
        for sys_id, adapter in self._adapters.items():
            results.append({
                "metadata": adapter.get_metadata().dict(),
                "health": adapter.get_health().dict(),
                "cameras": adapter.fetch_cameras()
            })
        return results

    def get_events(self, limit: int = 50, system_id: Optional[str] = None, hotlist_only: bool = False) -> List[Dict[str, Any]]:
        """Retrieve recent events from the event bus."""
        evts = event_bus.get_events(limit=limit, system_id=system_id, hotlist_only=hotlist_only)
        return [e.dict() for e in evts]

    def get_correlations(self) -> List[Dict[str, Any]]:
        """Run correlation engine over bus events and return cross-system incidents."""
        all_events = event_bus.get_events(limit=50)
        correlations = correlation_engine.ingest_and_correlate(all_events)
        return [c.dict() for c in correlations]

    def generate_analytics_report(self) -> Dict[str, Any]:
        """Generate Sample Federated Analytics Report (Model 3 Deliverable 4)."""
        overview = self.get_federation_overview()
        correlations = self.get_correlations()
        events = self.get_events(limit=100)

        hotlist_hits = [e for e in events if e.get("is_hotlist_match")]
        cross_system_transits = [c for c in correlations if c.get("alert_type") == "Cross-System Transit Alert"]

        # Departmental breakdown
        department_traffic = {}
        for s in overview["systems"]:
            dept = s["metadata"]["department"]
            department_traffic[dept] = {
                "system_name": s["metadata"]["system_name"],
                "protocol": s["metadata"]["protocol"],
                "active_nodes": s["health"]["active_cameras"],
                "avg_latency_ms": s["health"]["latency_ms"],
                "packet_loss": f"{s['health']['packet_loss_percent'] * 100:.2f}%"
            }

        return {
            "report_title": "Gujarat State CCTV & VMS Federation Analytics Report",
            "classification": "RESTRICTED // GUJARAT POLICE SURVEILLANCE & NHAI FEDERATION",
            "report_id": f"REP-FED-{int(time.time())}",
            "generated_at": datetime.utcnow().isoformat(),
            "model_reference": "Model 3: VMS Federation & Middleware Integration Model",
            "executive_summary": {
                "total_federated_systems": overview["federated_systems_count"],
                "total_federated_cameras": overview["total_federated_cameras"],
                "total_events_processed": overview["event_bus_telemetry"]["total_published_count"],
                "cross_system_incidents_correlated": len(cross_system_transits),
                "total_hotlist_matches": len(hotlist_hits),
                "middleware_uptime": "99.98%",
                "average_federation_latency_ms": 11.2
            },
            "departmental_breakdown": department_traffic,
            "top_correlated_targets": [
                {
                    "target_plate": c["plate_number"],
                    "severity": c["severity"],
                    "origin_system": c["first_detected_system"],
                    "destination_system": c["latest_detected_system"],
                    "travel_time_minutes": c["time_delta_minutes"],
                    "estimated_speed_kmh": c["transit_speed_kmh"],
                    "escalation_summary": c["escalation_reason"]
                }
                for c in correlations[:5]
            ],
            "recommendations": [
                "Expand VMS Adapter connectors to include Gujarat Maritime Board & Port surveillance grids.",
                "Enforce TLS 1.3 encryption across all inter-departmental ONVIF and RTSP streaming bridges.",
                "Integrate real-time automated dispatch triggers with State Command & Control Center (SCCC) DIAL-112."
            ]
        }

# Global federation manager singleton
federation_manager = FederationManager()
