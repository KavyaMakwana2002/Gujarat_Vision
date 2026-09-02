import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, text
from sqlalchemy.orm import declarative_base, sessionmaker
from src.security.auth import hash_password

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data'))
os.makedirs(DB_DIR, exist_ok=True)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_DIR}/traffic_data.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class VehicleDetection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String, index=True)         
    plate_number = Column(String, nullable=True)      
    timestamp = Column(DateTime, default=datetime.datetime.utcnow) 

class AdminUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)                        # Officer's Full Name
    id_number = Column(String, unique=True, index=True)          # Badge / Officer ID
    username = Column(String, unique=True, index=True)           # Login Username
    email = Column(String, nullable=True)                        # Official Email
    department = Column(String, default="Gujarat Traffic Police") # Department / Unit
    role = Column(String, default="Surveillance Officer")        # System Role
    password = Column(String, nullable=True)                     # Legacy plain password support
    password_hash = Column(String, nullable=True)                # PBKDF2 Hashed Password
    salt = Column(String, nullable=True)                         # Unique Password Salt
    is_active = Column(Boolean, default=True)                    # Account Status
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

# Create tables
Base.metadata.create_all(bind=engine)

def auto_migrate_db():
    """Ensure all columns exist in the SQLite database without crashing or dropping tables."""
    try:
        with engine.connect() as conn:
            # Check existing columns in users table
            result = conn.execute(text("PRAGMA table_info(users)"))
            existing_cols = [row[1] for row in result.fetchall()]
            
            desired_cols = {
                "name": "TEXT",
                "id_number": "TEXT",
                "username": "TEXT",
                "email": "TEXT",
                "department": "TEXT DEFAULT 'Gujarat Traffic Police'",
                "role": "TEXT DEFAULT 'Surveillance Officer'",
                "password": "TEXT",
                "password_hash": "TEXT",
                "salt": "TEXT",
                "is_active": "INTEGER DEFAULT 1",
                "created_at": "TIMESTAMP",
                "last_login": "TIMESTAMP"
            }
            
            for col, col_type in desired_cols.items():
                if col not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                        conn.commit()
                    except Exception as e:
                        pass
    except Exception as err:
        print(f"Migration notice: {err}")

auto_migrate_db()

def seed_default_admin():
    """Seed a default administrator officer account if database has no users."""
    db = SessionLocal()
class CctvRegistryItem(Base):
    __tablename__ = "cctv_registry"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String, unique=True, index=True, nullable=False) # e.g. GJ-POL-001
    name = Column(String, nullable=False)
    department = Column(String, index=True, nullable=False) # Police, AMC, SMC, VMC, RMC, GSRTC, GMB Port, RTO, Commercial
    camera_type = Column(String, index=True, default="Fixed Bullet") # PTZ 360, Fixed Dome, Fixed Bullet, ANPR High-Speed, 360 Fisheye, Thermal
    ownership = Column(String, default="Government Owned") # Government Owned, PPP Concession, Leased Infrastructure, Private Commercial
    connectivity_status = Column(String, index=True, default="Online") # Online, Offline, Degraded, Under Maintenance
    storage_details = Column(String, default="Local NVR (15 Days)") # Local NVR (15 Days), Central SAN (30 Days), Edge SD (7 Days), Cloud S3 (60 Days)
    installation_date = Column(String, default="2022-01-15") # YYYY-MM-DD
    warranty_expiry = Column(String, default="2025-01-15")
    resolution = Column(String, default="1080p") # 4K Ultra HD, 1080p Full HD, 720p HD
    codec = Column(String, default="H.264") # H.264, H.265
    city = Column(String, index=True, default="Ahmedabad")
    junction = Column(String, nullable=True)
    latitude = Column(String, default="23.0225")
    longitude = Column(String, default="72.5714")
    rtsp_url = Column(String, nullable=True)
    hls_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_by = Column(String, default="Super Admin")

# Create all tables including registry
Base.metadata.create_all(bind=engine)

def seed_default_admin():
    db = SessionLocal()
    try:
        count = db.query(AdminUser).count()
        if count == 0:
            default_salt = "sentinelsecure2026salt"
            pwd_hash, salt = hash_password("admin@123", default_salt)
            default_admin = AdminUser(
                name="Inspector Rajendra Jadeja",
                id_number="GJ-POL-007",
                username="admin",
                email="control.room@gujaratcybervision.gov.in",
                department="State Cyber & Traffic Command HQ",
                role="Super Admin",
                password="admin@123",
                password_hash=pwd_hash,
                salt=salt,
                is_active=True,
                created_at=datetime.datetime.utcnow()
            )
            db.add(default_admin)
            db.commit()
            print("[+] Default Admin Account Initialized: admin / admin@123")
    except Exception as e:
        print(f"[!] Seed notice: {e}")
    finally:
        db.close()

def seed_cctv_registry():
    """Seed comprehensive 120+ multi-department camera metadata dataset for Centralised Registry."""
    db = SessionLocal()
    try:
        if db.query(CctvRegistryItem).count() > 0:
            return

        print("[*] Seeding Centralised CCTV Multi-Department Registry (120+ Nodes)...")
        
        # 30 Real Sentinel Nodes from Operational Grid
        sentinel_cameras = [
            ("cam01", "Chiman bhai Bridge", "Ahmedabad", "23.0645", "72.5855", "Overpass Bridge Post"),
            ("cam02", "Janpath", "Ahmedabad", "23.0360", "72.5645", "Arterial Junction Post"),
            ("cam03", "O.N.G.C. Office", "Ahmedabad", "23.1118", "72.5830", "Chandkheda Institutional Post"),
            ("cam04", "Paldi Circle", "Ahmedabad", "23.0125", "72.5620", "Urban Traffic Circle"),
            ("cam05", "Visat teen Rasta", "Ahmedabad", "23.0970", "72.5890", "Sabarmati Tri-Junction"),
            ("cam06", "Timbavadi gate-Junagadh", "Junagadh", "21.5050", "70.4480", "City Entry Gate"),
            ("cam07", "hero-showroom-gir-somnath", "Gir Somnath", "20.9025", "70.3645", "Highway Commercial Post"),
            ("cam08", "majewadi-gate-junagadh", "Junagadh", "21.5280", "70.4610", "Historic Checkpost Gate"),
            ("cam09", "new-bypass-near-by-circle-junagadh-2", "Junagadh", "21.5420", "70.4720", "Highway Bypass Circle"),
            ("cam10", "char-chowk-road-2-junagadh", "Junagadh", "21.5210", "70.4590", "Central Four-Ways"),
            ("cam11", "dolatpara-junagadh", "Junagadh", "21.5510", "70.4780", "GIDC Industrial Highway"),
            ("cam12", "Tri Mandir Adalaj Tollnaka", "Gandhinagar", "23.1810", "72.5695", "Toll Plaza Highway Node"),
            ("cam13", "CN Vidhyalaya", "Ahmedabad", "23.0230", "72.5480", "Ambawadi Urban Corridor"),
            ("cam14", "Delight RLVD", "Ahmedabad", "23.0450", "72.5180", "Red Light Violation Detection"),
            ("cam15", "Suvidha park", "Ahmedabad", "23.0310", "72.5320", "Satellite Residential Post"),
            ("cam16", "Visat P2", "Ahmedabad", "23.1020", "72.5910", "Chandkheda Secondary Post"),
            ("cam17", "Rajkot Bus Port CCTV", "Rajkot", "22.3040", "70.8030", "Transit Terminal Node"),
            ("cam18", "Rajkot CCTV", "Rajkot", "22.2980", "70.7990", "Downtown Trikon Baug"),
            ("cam19", "KHAPARIA GRAM PANCHAYAT , TALUKA GANDEVI, DISTRICT NAVSARI", "Navsari", "20.8140", "72.9810", "Panchayat Security Post"),
            ("cam20", "Mohanpura", "Ahmedabad", "23.0305", "72.5990", "Kalupur Station Approach"),
            ("cam21", "Surat Ring Road Node", "Surat", "21.1820", "72.8250", "Majura Gate Corridor"),
            ("cam22", "Vadodara Sayajigunj Tower", "Vadodara", "22.3110", "73.1860", "Sayajigunj Central Node"),
            ("cam23", "Mehsana Modhera Circle", "Mehsana", "23.5930", "72.3780", "State Highway 41 Node"),
            ("cam24", "Dwarka Coastal Highway Post", "Devbhumi Dwarka", "22.2380", "68.9660", "Coastal Border Watch"),
            ("cam25", "Bhuj Border Highway Node", "Kutch", "23.2450", "69.6920", "Madhapar Border Corridor"),
            ("cam26", "Bhavnagar Ghogha Circle", "Bhavnagar", "21.7640", "72.1480", "Ghogha Port Circle"),
            ("cam27", "Jamnagar Port Road", "Jamnagar", "22.4680", "70.0580", "Digjam Industrial Corridor"),
            ("cam28", "Anand Expressway Toll Plaza", "Anand", "22.5620", "72.9510", "NE-1 Toll Plaza Post"),
            ("cam29", "Bharuch Narmada Bridge Gate", "Bharuch", "21.7050", "72.9980", "Golden Bridge River Post"),
            ("cam30", "Gujarat State Highway Patrol Node", "Gandhinagar", "23.2230", "72.6510", "State HQ Inter-District Grid"),
        ]

        items = []

        # Add 30 Operational Sentinel Grid Nodes (Gujarat Police)
        for cid, cname, ccity, clat, clng, cjunc in sentinel_cameras:
            items.append(CctvRegistryItem(
                camera_id=cid.upper(),
                name=cname,
                department="Gujarat Police",
                camera_type="ANPR High-Speed",
                ownership="Government Owned",
                connectivity_status="Online",
                storage_details="Central SAN (30 Days)",
                installation_date="2022-04-10",
                warranty_expiry="2027-04-10",
                resolution="1080p Full HD",
                codec="H.264",
                city=ccity,
                junction=cjunc,
                latitude=clat,
                longitude=clng,
                rtsp_url=f"rtsp://103.250.160.189:8554/stream/{cid}",
                hls_url=f"https://cctv.corp8.cloud/{cid}/index.m3u8",
                updated_by="Police Command"
            ))

        # Additional Multi-Department Cameras across Gujarat
        departments = [
            ("Ahmedabad Municipal Corp (AMC)", "AMC Smart City Command", "Municipal"),
            ("Surat Municipal Corp (SMC)", "SMC Safe City Center", "Municipal"),
            ("Vadodara Municipal Corp (VMC)", "VMC Urban Control", "Municipal"),
            ("Rajkot Municipal Corp (RMC)", "RMC Net Command", "Municipal"),
            ("GSRTC State Transport", "GSRTC Bus Terminal HQ", "Transport"),
            ("Gujarat Maritime Board (GMB)", "Port Security Division", "Ports"),
            ("RTO Gujarat", "State Border RTO Post", "Transport"),
            ("Commercial / Private NVR", "Shopkeeper / Industrial Security", "Private")
        ]

        sample_cities = [
            ("Ahmedabad", "23.0225", "72.5714"),
            ("Surat", "21.1702", "72.8311"),
            ("Vadodara", "22.3072", "73.1812"),
            ("Rajkot", "22.3039", "70.8022"),
            ("Gandhinagar", "23.2156", "72.6369"),
            ("Bhavnagar", "21.7645", "72.1519"),
            ("Jamnagar", "22.4707", "70.0577"),
            ("Kutch-Mundra", "22.8427", "69.7229"),
            ("Bharuch", "21.7051", "72.9959"),
            ("Navsari", "20.9500", "72.9300"),
            ("Dwarka", "22.2442", "68.9685"),
            ("Patan", "23.8500", "72.1200"),
            ("Mehsana", "23.5880", "72.3693"),
            ("Morbi", "22.8167", "70.8333"),
            ("Anand", "22.5645", "72.9289")
        ]

        cam_idx = 31
        for dept_name, division, category in departments:
            # 12 to 15 cameras per department
            for i in range(12):
                city_name, base_lat, base_lng = sample_cities[(cam_idx + i) % len(sample_cities)]
                lat_jitter = float(base_lat) + ((i * 17) % 50 - 25) * 0.003
                lng_jitter = float(base_lng) + ((i * 23) % 50 - 25) * 0.003
                
                # Introduce realistic variation in status, age, type
                is_ageing = (cam_idx % 4 == 0) # Ageing hardware (> 4-5 years)
                install_yr = "2018" if is_ageing else ("2021" if cam_idx % 3 == 0 else "2023")
                warranty_yr = str(int(install_yr) + 3)
                
                cam_types = ["Fixed Dome", "PTZ 360", "Fixed Bullet", "360 Fisheye", "ANPR High-Speed"]
                ctype = cam_types[(cam_idx + i) % len(cam_types)]
                
                statuses = ["Online", "Online", "Online", "Degraded", "Offline", "Under Maintenance"]
                status = statuses[(cam_idx + i) % len(statuses)]
                
                ownerships = ["Government Owned", "PPP Concession", "Leased Infrastructure", "Private Commercial"]
                ownership = "Private Commercial" if "Commercial" in dept_name else ownerships[(cam_idx) % 3]

                dept_prefix = dept_name.split()[0].upper()[:3]
                cam_code = f"GJ-{dept_prefix}-{cam_idx:03d}"

                items.append(CctvRegistryItem(
                    camera_id=cam_code,
                    name=f"{city_name} {division} Node #{i + 1}",
                    department=dept_name,
                    camera_type=ctype,
                    ownership=ownership,
                    connectivity_status=status,
                    storage_details="Local NVR (15 Days)" if is_ageing else "Central SAN (30 Days)",
                    installation_date=f"{install_yr}-0{(i % 9) + 1:02d}-15",
                    warranty_expiry=f"{warranty_yr}-0{(i % 9) + 1:02d}-15",
                    resolution="4K Ultra HD" if not is_ageing else "720p HD",
                    codec="H.265" if not is_ageing else "H.264",
                    city=city_name,
                    junction=f"Sector-{i+1} Junction ({city_name})",
                    latitude=f"{lat_jitter:.4f}",
                    longitude=f"{lng_jitter:.4f}",
                    rtsp_url=f"rtsp://gateway.gujarat.gov.in:8554/stream/{cam_code.lower()}",
                    hls_url=f"https://cctv.corp8.cloud/hls/{cam_code.lower()}.m3u8",
                    updated_by=f"{dept_prefix} Asset Admin"
                ))
                cam_idx += 1

        db.bulk_save_objects(items)
        db.commit()
        print(f"[+] Centralised CCTV Registry seeded with {len(items)} cameras across all departments!")
    except Exception as e:
        db.rollback()
        print(f"[!] Registry seed error: {e}")
    finally:
        db.close()

seed_default_admin()
seed_cctv_registry()
print("[+] Database & Security Schema successfully loaded!")