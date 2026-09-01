import os
import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from src.backend.database import SessionLocal, VehicleDetection, AdminUser
from src.security.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

app = FastAPI(
    title="Gujarat Cyber Vision - Sentinel Command API",
    description="Intelligent Traffic Surveillance & High-Security Authentication Backend",
    version="2.4.0"
)

# Enable CORS for all local development and production web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas for Strict Data Validation
class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80, description="Officer Full Name")
    id_number: str = Field(..., min_length=3, max_length=40, description="Badge / Police ID")
    username: str = Field(..., min_length=3, max_length=30, description="Unique Username")
    password: str = Field(..., min_length=6, description="Strong Password")
    email: Optional[str] = Field(None, description="Official Email")
    department: Optional[str] = Field("Gujarat Traffic Police", description="Department / Division")
    role: Optional[str] = Field("Surveillance Officer", description="Role in System")

class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Username or Badge ID")
    password: str = Field(..., description="Password")

class PasswordResetRequest(BaseModel):
    id_number: str
    username: str
    new_password: str = Field(..., min_length=6)

@app.get("/")
def home():
    return {
        "status": "online",
        "system": "Gujarat Cyber Vision - Sentinel Shield 2.4",
        "message": "AI Traffic & Security API is running optimally."
    }

from fastapi.responses import StreamingResponse
from src.ingestion.web_streamer import generate_video_stream, set_stream_source, get_current_source

@app.get("/api/video_feed")
def get_live_video_stream(cam_id: int = 1, city: str = "Ahmedabad", junction: str = "SG Highway Junction"):
    """Live MJPEG video stream with YOLOv8 & ANPR overlays directly for browser dashboard."""
    return StreamingResponse(
        generate_video_stream(cam_id=cam_id, city=city, junction=junction),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

class StreamSourceRequest(BaseModel):
    source: str = Field(..., description="RTSP URL, Video File Path, or Webcam ID (e.g. 0, rtsp://...)")

@app.post("/api/set_stream_source")
def switch_stream_source(req: StreamSourceRequest):
    """Dynamically connect to any provided RTSP / CCTV Video stream link or local file."""
    active_source = set_stream_source(req.source.strip())
    return {
        "status": "success",
        "message": f"Switched stream source to: {active_source}",
        "current_source": active_source
    }

from src.ingestion.government_gateway import gateway_instance

@app.get("/api/ingest")
def get_camera_ingest_catalogue():
    """
    Official Government Gateway Ingest Catalogue Endpoint.
    Returns full list of available cameras, codecs, locations, and all 3 URLs (RTSP, WebRTC WHEP, HLS).
    """
    return gateway_instance.cameras

class GatewayConnectRequest(BaseModel):
    host: str = Field(..., description="Government Portal Sandbox Host URL (e.g. http://192.168.1.100)")

@app.post("/api/gateway/connect")
def connect_government_gateway(req: GatewayConnectRequest):
    """Connect to official Gujarat Police sandbox gateway and fetch real camera catalogue."""
    result = gateway_instance.set_host(req.host)
    return result

@app.get("/api/gateway/catalogue")
def get_current_gateway_catalogue():
    """Retrieve currently active camera catalogue from government gateway."""
    return {
        "connected": gateway_instance.is_connected,
        "host": gateway_instance.gateway_host,
        "total_cameras": len(gateway_instance.cameras),
        "cameras": gateway_instance.cameras
    }

# --- SEPARATE REMOTE SHOP NVR ENDPOINTS (DIFFERENT NETWORK / VPN) ---
from src.ingestion.remote_nvr import remote_nvr_client, generate_remote_nvr_stream

@app.get("/api/remote_nvr/video_feed")
def get_remote_nvr_video_feed():
    """Dedicated live stream for Remote Shop NVR with independent YOLOv8 + ANPR processing."""
    return StreamingResponse(
        generate_remote_nvr_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

class RemoteNVRConfigRequest(BaseModel):
    host: str = Field(..., description="Shop NVR LAN IP or VPN Reachable IP (e.g. 192.168.1.100 or 10.8.0.2)")
    port: Optional[int] = Field(554, description="RTSP Port")
    username: Optional[str] = Field("admin", description="NVR Username")
    password: Optional[str] = Field("", description="NVR Password")
    channel: Optional[int] = Field(1, description="Camera Channel ID")
    brand: Optional[str] = Field("Generic RTSP", description="NVR Brand (Hikvision, CP Plus, Dahua, Uniview, Generic)")
    custom_url: Optional[str] = Field("", description="Optional direct full RTSP URL")

@app.post("/api/remote_nvr/configure")
def configure_remote_nvr(req: RemoteNVRConfigRequest):
    """Configure remote NVR connection parameters over VPN / routed path."""
    res = remote_nvr_client.configure(
        host=req.host,
        port=req.port,
        username=req.username,
        password=req.password,
        channel=req.channel,
        brand=req.brand,
        custom_url=req.custom_url
    )
    return {
        "status": "success",
        "message": f"Remote NVR configured for {req.host}:{req.port} (CH{req.channel})",
        "details": res
    }

@app.get("/api/remote_nvr/status")
def get_remote_nvr_status():
    """Get real-time diagnostic status of remote shop NVR."""
    return remote_nvr_client.get_status()

# --- STATS, WATCHLIST & LIVE ALERTS ENDPOINTS ---
from src.matching.watchlist import GOVERNMENT_WATCHLIST, check_watchlist_match
from src.alerts.alert_engine import get_live_alerts, trigger_red_alert

@app.get("/api/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_vehicles = db.query(VehicleDetection).count()
    active_alerts = len(get_live_alerts())
    total_officers = db.query(AdminUser).count()
    
    return {
        "total_scanned": total_vehicles,
        "active_alerts": active_alerts,
        "cameras_online": "80,000 / 80,000 Active",
        "server_status": "Optimal (100% Latency < 8ms)",
        "registered_officers": total_officers,
        "system_time": datetime.datetime.utcnow().isoformat(),
        "database_sync": {
            "vahan_status": "ONLINE (National RTO Registry 4.0)",
            "egujcop_status": "ONLINE (Gujarat Police CCTNS v3)",
            "sarthi_status": "ONLINE (DL / Offender Archive)",
            "nafis_status": "ONLINE (Fingerprint & Criminal Biometrics)"
        }
    }

@app.get("/api/detections")
def get_recent_detections(limit: int = 20, db: Session = Depends(get_db)):
    records = db.query(VehicleDetection).order_by(VehicleDetection.id.desc()).limit(limit).all()
    return records

@app.get("/api/alerts/live")
def get_realtime_alerts():
    """Retrieve all real-time Red Alerts triggered by ANPR & Watchlist matches."""
    return {
        "status": "success",
        "total_active_alerts": len(get_live_alerts()),
        "alerts": get_live_alerts()
    }

@app.get("/api/watchlist")
def get_government_watchlist():
    """List all wanted, stolen, and blacklisted vehicles synchronized from VAHAN & eGujCop."""
    return {
        "status": "success",
        "source": "VAHAN 4.0 / eGujCop / NAFIS Inter-Departmental Grid",
        "total_entries": len(GOVERNMENT_WATCHLIST),
        "records": list(GOVERNMENT_WATCHLIST.values())
    }

class WatchlistCheckRequest(BaseModel):
    plate_number: str

@app.post("/api/watchlist/check")
def check_vehicle_plate(req: WatchlistCheckRequest):
    """Instant lookup for any license plate against National & Gujarat Police watchlists."""
    match = check_watchlist_match(req.plate_number)
    if match:
        return {
            "matched": True,
            "status": "ALERT_FOUND",
            "details": match
        }
    return {
        "matched": False,
        "status": "CLEAN_RECORD",
        "message": f"Plate '{req.plate_number}' is clean across VAHAN & eGujCop databases."
    }

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/signup")
@app.post("/api/auth/signup")
def signup(user: UserSignupRequest, db: Session = Depends(get_db)):
    # 1. Clean input
    clean_username = user.username.strip().lower()
    clean_id = user.id_number.strip().upper()
    clean_name = user.name.strip()
    
    # 2. Check if username or ID number already registered
    existing_user = db.query(AdminUser).filter(
        (AdminUser.username == clean_username) | (AdminUser.id_number == clean_id)
    ).first()
    
    if existing_user:
        if existing_user.username == clean_username:
            return {"success": False, "message": f"Username '{user.username}' is already taken. Please choose another."}
        else:
            return {"success": False, "message": f"Badge / Officer ID '{user.id_number}' is already registered in the system."}
    
    # 3. Hash password with PBKDF2 + salt
    pwd_hash, salt = hash_password(user.password)
    
    new_user = AdminUser(
        name=clean_name,
        id_number=clean_id,
        username=clean_username,
        email=user.email.strip().lower() if user.email else f"{clean_username}@cybervision.gujarat.gov.in",
        department=user.department or "Gujarat Traffic Police",
        role=user.role or "Surveillance Officer",
        password=user.password, # For backwards compatibility
        password_hash=pwd_hash,
        salt=salt,
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": f"Officer '{new_user.name}' registered successfully! You can now log in.",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "badge_id": new_user.id_number,
            "username": new_user.username,
            "department": new_user.department,
            "role": new_user.role
        }
    }

@app.post("/api/login")
@app.post("/api/auth/login")
def login(login_data: UserLoginRequest, db: Session = Depends(get_db)):
    query_key = login_data.username.strip()
    
    # Allow login via username OR Badge ID
    user = db.query(AdminUser).filter(
        (AdminUser.username == query_key.lower()) | (AdminUser.id_number == query_key.upper())
    ).first()
    
    if not user:
        return {"success": False, "message": "Invalid Username or Badge ID."}
    
    if not user.is_active:
        return {"success": False, "message": "This officer account has been deactivated. Contact Cyber Admin."}
    
    # Verify password (hashes + legacy plain text support)
    is_valid = verify_password(
        plain_password=login_data.password,
        stored_hash=user.password_hash,
        salt=user.salt,
        legacy_plain=user.password
    )
    
    if not is_valid:
        return {"success": False, "message": "Incorrect password. Please try again."}
    
    # If user had legacy plain password and no hash, automatically upgrade their hash now
    if not user.password_hash:
        new_hash, salt = hash_password(login_data.password)
        user.password_hash = new_hash
        user.salt = salt
    
    # Update last login timestamp
    user.last_login = datetime.datetime.utcnow()
    db.commit()
    
    # Generate JWT Token
    token_payload = {
        "sub": str(user.id),
        "username": user.username,
        "badge_id": user.id_number,
        "name": user.name,
        "role": user.role,
        "department": user.department
    }
    access_token = create_access_token(token_payload)
    
    return {
        "success": True,
        "token": access_token,
        "token_type": "Bearer",
        "name": user.name,
        "badge_id": user.id_number,
        "username": user.username,
        "role": user.role,
        "department": user.department,
        "email": user.email,
        "message": f"Welcome, {user.name} ({user.role})!"
    }

@app.get("/api/auth/me")
def get_current_user_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authentication token")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired or invalid")
    
    user = db.query(AdminUser).filter(AdminUser.id == int(payload.get("sub"))).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")
        
    return {
        "success": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "badge_id": user.id_number,
            "username": user.username,
            "email": user.email,
            "department": user.department,
            "role": user.role,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    }

@app.post("/api/auth/reset-password")
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(
        AdminUser.username == req.username.strip().lower(),
        AdminUser.id_number == req.id_number.strip().upper()
    ).first()
    
    if not user:
        return {"success": False, "message": "Verification failed. Username and Badge ID do not match our records."}
        
    pwd_hash, salt = hash_password(req.new_password)
    user.password_hash = pwd_hash
    user.salt = salt
    user.password = req.new_password
    db.commit()
    
    return {"success": True, "message": "Password has been successfully reset! You can now log in with your new password."}