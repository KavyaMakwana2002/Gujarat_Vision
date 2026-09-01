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

seed_default_admin()
print("[+] Database & Security Schema successfully loaded!")