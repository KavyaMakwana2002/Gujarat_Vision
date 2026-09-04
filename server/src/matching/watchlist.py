import datetime

# Simulated VAHAN (National Vehicle Register) & eGujCop (Gujarat Police CCTNS) Live Watchlist Database
GOVERNMENT_WATCHLIST = {
    "GJ01AB1234": {
        "plate": "GJ01AB1234",
        "owner": "Ramesh P. Solanki (Reported Stolen)",
        "vehicle_type": "Car (Hyundai Creta - White)",
        "status": "STOLEN_VEHICLE",
        "fir_number": "FIR/2026/AHM/4092",
        "police_station": "Satellite Police Station, Ahmedabad",
        "database_source": "VAHAN 4.0 & eGujCop",
        "alert_level": "CRITICAL_RED",
        "crime_category": "Vehicle Theft / Robbery Case",
        "action_required": "Intercept Vehicle Immediately - Alert Nearest PCR Van"
    },
    "GJ05CD5678": {
        "plate": "GJ05CD5678",
        "owner": "Vikram K. Dodiya",
        "vehicle_type": "Truck (Tata 407 - Yellow)",
        "status": "WANTED_CRIMINAL_TRANSPORT",
        "fir_number": "FIR/2026/SUR/1182",
        "police_station": "Varachha Police Station, Surat",
        "database_source": "eGujCop & NAFIS Crime Sync",
        "alert_level": "CRITICAL_RED",
        "crime_category": "Contraband Smuggling / Inter-District Fugitive",
        "action_required": "Deploy Toll Plaza Barricade & Detain Driver"
    },
    "GJ03EF9999": {
        "plate": "GJ03EF9999",
        "owner": "Unknown (Fake Registration Number Plate)",
        "vehicle_type": "Motorcycle (Royal Enfield - Black)",
        "status": "SUSPICIOUS_PLATE",
        "fir_number": "FIR/2026/RJK/7719",
        "police_station": "Pradhyuman Nagar PS, Rajkot",
        "database_source": "VAHAN RTO Blacklist & SARTHI",
        "alert_level": "HIGH_YELLOW",
        "crime_category": "Forged Number Plate / RTO Blacklisted",
        "action_required": "Issue High Alert to City Traffic Interceptors"
    },
    "GJ10XY4321": {
        "plate": "GJ10XY4321",
        "owner": "Hasmukh R. Patel (Wanted in Cyber Fraud)",
        "vehicle_type": "Car (Maruti Swift - Grey)",
        "status": "WANTED_FUGITIVE",
        "fir_number": "FIR/2026/JAM/0932",
        "police_station": "Jamnagar Cyber Crime Cell",
        "database_source": "eGujCop Cyber Cell & NAFIS",
        "alert_level": "CRITICAL_RED",
        "crime_category": "Financial Crime & Inter-State Cyber Fraud",
        "action_required": "Immediate Detention & Seizure of Electronic Devices"
    },
    "GJ12ZZ8888": {
        "plate": "GJ12ZZ8888",
        "owner": "Bhuj Border Area Alert",
        "vehicle_type": "SUV (Mahindra Scorpio - White)",
        "status": "BORDER_SECURITY_ALERT",
        "fir_number": "FIR/2026/KTC/5501",
        "police_station": "Bhuj 'A' Division Police Station",
        "database_source": "NAFIS & Coastal Border Security Grid",
        "alert_level": "CRITICAL_RED",
        "crime_category": "Coastal Border Infiltration Suspect",
        "action_required": "Alert BSF & Coastal Highway Checkposts"
    }
}

def clean_plate_string(raw_plate: str) -> str:
    """Normalize plate string by stripping spaces and symbols."""
    if not raw_plate:
        return ""
    return "".join(c for c in raw_plate if c.isalnum()).upper()

def check_watchlist_match(raw_plate: str) -> dict:
    """
    Check if a detected number plate matches against VAHAN, eGujCop, SARTHI, or NAFIS.
    Returns match dict if found, else None.
    """
    cleaned = clean_plate_string(raw_plate)
    if not cleaned:
        return None
    
    # Exact lookup
    if cleaned in GOVERNMENT_WATCHLIST:
        record = GOVERNMENT_WATCHLIST[cleaned].copy()
        record["timestamp"] = datetime.datetime.utcnow().isoformat()
        return record
    
    # Fuzzy sub-string match for standard Indian plates (e.g. GJ-01-AB-1234)
    for plate_key, record in GOVERNMENT_WATCHLIST.items():
        if plate_key in cleaned or cleaned in plate_key:
            rec = record.copy()
            rec["timestamp"] = datetime.datetime.utcnow().isoformat()
            return rec
            
    return None