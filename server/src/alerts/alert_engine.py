import datetime
import json
from typing import List, Dict

# In-memory storage for active live alerts
LIVE_ALERTS_LOG: List[Dict] = [
    {
        "id": "ALT-2026-001",
        "plate": "GJ01AB1234",
        "vehicle_type": "Car (Hyundai Creta - White)",
        "alert_type": "STOLEN_VEHICLE_RED_ALERT",
        "location": "Ahmedabad SG Highway - Iscon Cross Road",
        "camera_id": "CAM-0012",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database_source": "VAHAN 4.0 & eGujCop",
        "fir_number": "FIR/2026/AHM/4092",
        "police_station": "Satellite PS",
        "status": "DISPATCHED",
        "pcr_assigned": "PCR GJ-01-POL-04 (0.8 km away)",
        "severity": "CRITICAL"
    }
]

def trigger_red_alert(plate: str, vehicle_type: str, match_data: dict, camera_id: str = "CAM-0001", location: str = "SG Highway Hub") -> dict:
    """
    Trigger a high-priority government security alert when a stolen/wanted vehicle is detected.
    """
    alert_id = f"ALT-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    alert_record = {
        "id": alert_id,
        "plate": plate,
        "vehicle_type": vehicle_type,
        "alert_type": match_data.get("status", "CRITICAL_SECURITY_ALERT"),
        "location": location,
        "camera_id": camera_id,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database_source": match_data.get("database_source", "VAHAN & eGujCop"),
        "fir_number": match_data.get("fir_number", "N/A"),
        "police_station": match_data.get("police_station", "State Control HQ"),
        "status": "ACTIVE_SIREN_TRIGGERED",
        "pcr_assigned": "Nearest Highway Patrol Dispatched",
        "severity": match_data.get("alert_level", "CRITICAL_RED"),
        "action_required": match_data.get("action_required", "Immediate Intercept")
    }
    
    LIVE_ALERTS_LOG.insert(0, alert_record)
    
    print("\n" + "="*70)
    print(f"[!] [GOVERNMENT RED ALERT SIREN ACTIVATED] [!]")
    print(f"[!] Target Plate: {plate} | Source: {alert_record['database_source']}")
    print(f"[!] Crime Case: {match_data.get('crime_category', 'Stolen Vehicle')}")
    print(f"[!] Location: {location} ({camera_id})")
    print(f"[!] Dispatch Action: {alert_record['action_required']}")
    print("="*70 + "\n")
    
    return alert_record

def get_live_alerts() -> List[Dict]:
    """Retrieve all active real-time alerts."""
    return LIVE_ALERTS_LOG[:30]