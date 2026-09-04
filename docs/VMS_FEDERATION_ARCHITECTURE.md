# Gujarat Cyber Vision - Model 3: VMS Federation & Middleware Integration Architecture

## 1. Executive Overview
Model 3 introduces a high-throughput **VMS Federation & Middleware Integration Layer** designed to unify disparate, departmental CCTV systems across Gujarat (e.g., Gujarat Police Smart City VMS, NHAI National Highway & Toll Plaza ANPR, Smart Cities Municipal CCTV, and Private Commercial Gateways) without replacing underlying vendor hardware.

```
+-----------------------------------------------------------------------------------+
|                        GUJARAT UNIFIED COMMAND & CONTROL                          |
|         (Tactical Video Wall, Sentinel AI Hub, GIS Map, Correlated Alerts)       |
+-----------------------------------------+-----------------------------------------+
                                          |
                        +-----------------+-----------------+
                        |   REST API & WebSockets Gateway   |
                        |   /api/federation/*               |
                        +-----------------+-----------------+
                                          |
+-----------------------------------------v-----------------------------------------+
|                    FEDERATION MIDDLEWARE & CORRELATION CORE                       |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |             Central Federation Manager (Routing, Auth, Orchestration)       |  |
|  +--------------------------------------+--------------------------------------+  |
|                                         |                                         |
|  +--------------------------------------v--------------------------------------+  |
|  |           Asynchronous Metadata & Event Bus (Pub/Sub Event Broker)          |  |
|  +--------------------------------------+--------------------------------------+  |
|                                         |                                         |
|  +--------------------------------------v--------------------------------------+  |
|  |       Cross-System Spatio-Temporal Event Correlation Engine (ANPR Track)    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------+
|                         ADAPTER / CONNECTOR LAYER (PLUGINS)                       |
|                                                                                   |
|  +------------------------+  +------------------------+  +---------------------+  |
|  | CityPoliceVMSAdapter   |  |  HighwayTollVMSAdapter |  | ThirdPartyConnector |  |
|  | (Milestone/HikCentral) |  |  (Dahua DSS / FastTag) |  | (ONVIF / RTSP API)  |  |
|  +-----------+------------+  +-----------+------------+  +----------+----------+  |
+--------------|---------------------------|--------------------------|-------------+
               |                           |                          |
+--------------v------------+  +-----------v------------+  +----------v-------------+
|    GUJARAT POLICE VMS     |  |    NHAI HIGHWAY VMS    |  |   MUNICIPAL / PORTS    |
| (City CCTV & Checkpoints) |  | (NE-1 Toll Plazas)     |  | (Smart City Cameras)   |
+---------------------------+  +------------------------+  +------------------------+
```

---

## 2. Core Functional Features

### 2.1 Adapter / Plugin Architecture
The system standardizes communication with all VMS vendors via the `BaseVMSAdapter` abstract base class:
- **`connect()` / `disconnect()`**: Manages session handshakes, tokens, and keep-alive sockets.
- **`get_health()`**: Returns real-time latency (ms), packet loss, FPS, and online status.
- **`fetch_cameras()`**: Normalizes vendor-specific camera catalogs into a unified schema.
- **`get_stream_uri(camera_id)`**: Resolves secure RTSP/HLS/WebRTC streaming endpoints.
- **`fetch_recent_events()`**: Emits normalized ANPR and perimeter alerts (`VMSEvent`).

### 2.2 Metadata Exchange Bus
- Asynchronous Pub/Sub broker that aggregates events across all federated VMS platforms.
- Eliminates tight point-to-point coupling between departmental databases.
- Supports filtering by `system_id`, `hotlist_only`, and geo-zones.

### 2.3 Cross-System Spatio-Temporal Correlation Engine
- Detects the same license plate traversing multiple systems (e.g. Highway Toll Plaza ➔ City Police Junction).
- Calculates transit delta ($\Delta t$), distance ($\Delta d$), and transit velocity ($v = \frac{\Delta d}{\Delta t}$).
- Escalates multi-jurisdiction hotlist matches with severe threat priorities.

---

## 3. Extensible Connector Developer Guide (Onboarding New Vendors)

To add a new VMS platform (e.g., Surat Municipal Corporation Smart City VMS), developers simply extend `BaseVMSAdapter`:

```python
from src.federation.base_adapter import BaseVMSAdapter, VMSHealthStatus, VMSEvent

class SuratSmartCityVMSAdapter(BaseVMSAdapter):
    def __init__(self):
        super().__init__(
            system_id="vms-node-03-smc",
            system_name="Surat Municipal Smart City VMS",
            department="Surat Municipal Corporation",
            vendor_type="Hikvision HikCentral Enterprise",
            protocol="RTSP / ONVIF Profile S",
            endpoint="10.22.100.5:8000"
        )

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def get_health(self) -> VMSHealthStatus:
        return VMSHealthStatus(is_online=True, latency_ms=9.4, active_cameras=10, total_cameras=10)

    def fetch_cameras(self):
        return [{"id": "smc-01", "name": "Surat Dumas Road Circle", "location": "Surat"}]

    def get_stream_uri(self, camera_id: str):
        return "rtsp://gateway.smc.gov.in/live/stream01"

    def fetch_recent_events(self, limit=10):
        return []
```

Register dynamically via API:
```http
POST /api/federation/onboard_adapter
Content-Type: application/json

{
  "system_name": "Surat Municipal Smart City VMS",
  "department": "Surat Municipal Corporation",
  "vendor_type": "Hikvision HikCentral",
  "protocol": "RTSP / ONVIF Profile S",
  "endpoint": "10.22.100.5:8000"
}
```

---

## 4. API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/federation/overview` | Full middleware health, total cameras, and telemetry overview. |
| `GET` | `/api/federation/systems` | List of all federated VMS systems and cataloged cameras. |
| `GET` | `/api/federation/events` | Live event stream from the metadata bus. |
| `GET` | `/api/federation/correlations` | Spatio-temporal vehicle correlation incidents. |
| `POST` | `/api/federation/onboard_adapter` | Dynamic runtime onboarding of third-party VMS vendors. |
| `GET` | `/api/federation/analytics_report` | Generates official sample federated analytics intelligence report. |

---

## 5. Security & Encryption Standards
- **Inter-VMS Tunneling**: TLS 1.3 encrypted REST & RTSP over TCP.
- **Authentication**: JWT Bearer Token validation across all federation gateway routes.
- **Audit Logging**: Spatio-temporal queries are logged with immutable timestamp hashes for evidential integrity.
