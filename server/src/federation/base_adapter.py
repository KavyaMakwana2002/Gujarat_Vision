from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
import time
from datetime import datetime

class VMSHealthStatus(BaseModel):
    is_online: bool = True
    latency_ms: float = 12.5
    active_cameras: int = 0
    total_cameras: int = 0
    fps: float = 25.0
    packet_loss_percent: float = 0.0
    last_sync: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    details: Dict[str, Any] = Field(default_factory=dict)

class VMSSystemMetadata(BaseModel):
    system_id: str
    system_name: str
    department: str
    vendor_type: str  # e.g., "Gujarat Police City VMS", "NHAI Toll VMS", "HikCentral", "Milestone XProtect", "Dahua DSS"
    protocol: str     # e.g., "RTSP/ONVIF", "REST API + Webhook", "gRPC"
    base_endpoint: str
    version: str = "3.2.0"
    is_active: bool = True
    managed_zones: List[str] = Field(default_factory=list)

class VMSEvent(BaseModel):
    event_id: str
    source_system_id: str
    source_system_name: str
    camera_id: str
    camera_location: str
    gps_coordinates: Optional[Dict[str, float]] = None
    plate_number: str
    vehicle_class: str
    confidence: float
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    snapshot_url: Optional[str] = None
    is_hotlist_match: bool = False
    hotlist_category: Optional[str] = None
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)

class BaseVMSAdapter(ABC):
    """
    Abstract Base Class defining the standard VMS Adapter / Connector interface.
    Enables heterogeneous CCTV/VMS systems (Police, Highway Tolls, Municipalities, Private Vendors)
    to plug into the Gujarat Cyber Vision Federation Layer seamlessly.
    """

    def __init__(self, system_id: str, system_name: str, department: str, vendor_type: str, protocol: str, endpoint: str):
        self.system_id = system_id
        self.system_name = system_name
        self.department = department
        self.vendor_type = vendor_type
        self.protocol = protocol
        self.endpoint = endpoint
        self.is_connected = False
        self._cameras: List[Dict[str, Any]] = []

    @abstractmethod
    def connect(self) -> bool:
        """Establish handshake & authentication with the target VMS system."""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Gracefully release connection sessions."""
        pass

    @abstractmethod
    def get_health(self) -> VMSHealthStatus:
        """Retrieve real-time telemetry, latency, packet loss, and camera health."""
        pass

    @abstractmethod
    def fetch_cameras(self) -> List[Dict[str, Any]]:
        """Retrieve the catalog of managed camera nodes."""
        pass

    @abstractmethod
    def get_stream_uri(self, camera_id: str) -> Optional[str]:
        """Resolve standard RTSP/HLS/WebRTC streaming URL for a specific camera."""
        pass

    @abstractmethod
    def fetch_recent_events(self, limit: int = 20) -> List[VMSEvent]:
        """Fetch latest ANPR and security events emitted by this VMS node."""
        pass

    def get_metadata(self) -> VMSSystemMetadata:
        """Return high-level metadata descriptor for federation registry."""
        return VMSSystemMetadata(
            system_id=self.system_id,
            system_name=self.system_name,
            department=self.department,
            vendor_type=self.vendor_type,
            protocol=self.protocol,
            base_endpoint=self.endpoint,
            is_active=self.is_connected,
            managed_zones=[c.get("location", "Gujarat") for c in self._cameras[:5]]
        )
