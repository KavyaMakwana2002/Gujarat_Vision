import re
import cv2
import gc
import numpy as np

try:
    import easyocr
    import torch
    HAS_EASYOCR = True
except ImportError:
    HAS_EASYOCR = False
    easyocr = None
    torch = None

GUJARAT_RTO_MAP = {
    "01": "Ahmedabad (City - Subhash Bridge)",
    "02": "Mehsana",
    "03": "Rajkot",
    "04": "Bhavnagar",
    "05": "Surat (City - Central)",
    "06": "Vadodara",
    "07": "Kheda (Nadiad)",
    "08": "Banaskantha (Palanpur)",
    "09": "Sabarkantha (Himmatnagar)",
    "10": "Jamnagar",
    "11": "Junagadh",
    "12": "Kutch (Bhuj)",
    "13": "Surendranagar",
    "14": "Amreli",
    "15": "Valsad",
    "16": "Bharuch",
    "17": "Panchmahal (Godhra)",
    "18": "Gandhinagar",
    "19": "Bardoli",
    "20": "Dahod",
    "21": "Navsari",
    "22": "Narmada (Rajpipla)",
    "23": "Anand",
    "24": "Patan",
    "25": "Porbandar",
    "26": "Tapi (Vyara)",
    "27": "Ahmedabad (East - Vastral)",
    "28": "Surat (West - Pal)",
    "29": "Vadodara (Rural)",
    "30": "Dang (Ahwa)",
    "31": "Aravalli (Modasa)",
    "32": "Gir Somnath (Veraval)",
    "33": "Botad",
    "34": "Chhota Udepur",
    "35": "Mahisagar (Lunawada)",
    "36": "Morbi",
    "37": "Devbhoomi Dwarka",
    "38": "Gir Somnath (Bypass)"
}

INDIAN_STATES = {
    "GJ": "Gujarat",
    "MH": "Maharashtra",
    "DL": "Delhi",
    "RJ": "Rajasthan",
    "MP": "Madhya Pradesh",
    "UP": "Uttar Pradesh",
    "KA": "Karnataka",
    "TN": "Tamil Nadu",
    "HR": "Haryana",
    "PB": "Punjab",
    "AP": "Andhra Pradesh",
    "TS": "Telangana"
}

def clean_plate_string(raw_text: str) -> str:
    """Normalize raw OCR string into uppercase alphanumeric string."""
    if not raw_text:
        return ""
    # Remove all non-alphanumerics
    cleaned = re.sub(r'[^A-Z0-9]', '', str(raw_text).upper())
    # Correct common OCR confusions in Indian plate fonts (e.g. IND prefix, O vs 0, I vs 1)
    if cleaned.startswith("IND"):
        cleaned = cleaned[3:]
    return cleaned

def format_plate_standard(raw_str: str) -> tuple[str, str, str, str]:
    """
    Standardize Indian License Plate into a unified format:
    e.g. GJ-01-AB-1234 or GJ-01-BK5268
    Returns: (formatted_plate, rto_district, state_name, clean_normalized)
    """
    cleaned = clean_plate_string(raw_str)
    if not cleaned or len(cleaned) < 4:
        return (raw_str or "UNKNOWN", "Gujarat State RTO", "Gujarat", cleaned or "UNKNOWN")

    state_code = cleaned[:2]
    state_name = INDIAN_STATES.get(state_code, "Gujarat")
    
    # Try Regex pattern: State (2 chars) + RTO (1-2 digits) + Series (1-3 letters) + Number (1-4 digits)
    pattern = r'^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{1,4})$'
    match = re.match(pattern, cleaned)
    
    if match:
        st, rto_num, series, num = match.groups()
        rto_num_padded = f"{int(rto_num):02d}"
        formatted = f"{st}-{rto_num_padded}-{series}-{int(num):04d}"
        
        district = GUJARAT_RTO_MAP.get(rto_num_padded, f"Gujarat RTO (GJ-{rto_num_padded})") if st == "GJ" else f"{state_name} RTO ({st}-{rto_num_padded})"
        return (formatted, district, state_name, cleaned)

    # Fallback pattern if no series letter (e.g. government/police: GJ-01-1234)
    pattern_noseries = r'^([A-Z]{2})([0-9]{1,2})([0-9]{4})$'
    match_noseries = re.match(pattern_noseries, cleaned)
    if match_noseries:
        st, rto_num, num = match_noseries.groups()
        rto_num_padded = f"{int(rto_num):02d}"
        formatted = f"{st}-{rto_num_padded}-{num}"
        district = GUJARAT_RTO_MAP.get(rto_num_padded, f"Gujarat RTO (GJ-{rto_num_padded})") if st == "GJ" else f"{state_name} RTO ({st}-{rto_num_padded})"
        return (formatted, district, state_name, cleaned)

    # Generic clean format
    if len(cleaned) >= 8 and cleaned[:2].isalpha() and cleaned[2:4].isdigit():
        st = cleaned[:2]
        rto = cleaned[2:4]
        rest = cleaned[4:]
        formatted = f"{st}-{rto}-{rest}"
        district = GUJARAT_RTO_MAP.get(rto, f"Gujarat RTO (GJ-{rto})") if st == "GJ" else f"{state_name} RTO ({st}-{rto})"
        return (formatted, district, state_name, cleaned)

    return (cleaned, "Gujarat RTO Division", state_name, cleaned)


class LicensePlateReader:
    def __init__(self):
        self.reader = None
        self._init_attempted = False

    def _get_reader(self):
        if not HAS_EASYOCR:
            return None
            
        if self.reader is None and not self._init_attempted:
            self._init_attempted = True
            try:
                use_gpu = torch.cuda.is_available() if torch else False
                print(f"[*] ANPR (EasyOCR) Engine loading... (GPU={use_gpu})")
                self.reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
                print("[+] ANPR (EasyOCR) Engine ready.")
                gc.collect()
            except Exception as e:
                print(f"[!] Warning: EasyOCR initialization note: {e}")
                self.reader = None

        return self.reader

    def read_plate(self, image_crop):
        """Read plate from vehicle bounding box crop in live video."""
        reader = self._get_reader()
        if not reader or image_crop is None or image_crop.size == 0:
            return ""
        try:
            h, w = image_crop.shape[:2]
            if h < 20 or w < 30:
                return ""

            # Target the bottom 65% of the vehicle where license plates reside
            plate_roi = image_crop[int(h * 0.35):, :] if h > 60 else image_crop
            gray = cv2.cvtColor(plate_roi, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            if plate_roi.shape[1] < 200:
                enhanced = cv2.resize(enhanced, (0, 0), fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

            results = reader.readtext(enhanced, paragraph=False, batch_size=1)
            if not results:
                results = reader.readtext(image_crop, paragraph=False, batch_size=1)

            detected_text = ""
            for (bbox, text, prob) in results:
                if prob > 0.30:
                    clean = clean_plate_string(text)
                    if len(clean) >= 3:
                        detected_text += clean

            return detected_text.strip()
        except Exception as e:
            return ""

    def read_full_image_ocr(self, image_bgr) -> dict:
        """
        Deep OCR scan on full uploaded image or camera snapshot frame.
        Extracts all textual tokens, searches for Indian license plate candidates,
        and returns standardized plate data.
        """
        if image_bgr is None or image_bgr.size == 0:
            return {"status": "error", "message": "Invalid image data"}

        reader = self._get_reader()
        
        # 1. Image Preprocessing & Multi-scale Enhancements
        h, w = image_bgr.shape[:2]
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Scale down huge images to prevent RAM spike
        if max(h, w) > 1600:
            scale = 1600.0 / max(h, w)
            image_bgr = cv2.resize(image_bgr, (0, 0), fx=scale, fy=scale)
            enhanced = cv2.resize(enhanced, (0, 0), fx=scale, fy=scale)

        all_detected_tokens = []
        best_candidate = None
        best_score = 0.0

        if reader:
            try:
                # Primary OCR Pass on enhanced grayscale
                ocr_results = reader.readtext(enhanced, paragraph=False)
                
                # If no text found, try color pass
                if not ocr_results:
                    ocr_results = reader.readtext(image_bgr, paragraph=False)

                for (bbox, text, prob) in ocr_results:
                    clean = clean_plate_string(text)
                    if clean:
                        all_detected_tokens.append({"text": text, "clean": clean, "prob": float(prob)})

                    # Check if token matches Indian plate regex pattern
                    if re.match(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$', clean):
                        score = float(prob) + 1.0  # High bonus for exact format match
                        if score > best_score:
                            best_score = score
                            best_candidate = clean
                    elif len(clean) >= 6 and (clean.startswith("GJ") or clean.startswith("MH") or clean.startswith("DL")):
                        score = float(prob) + 0.5
                        if score > best_score:
                            best_score = score
                            best_candidate = clean

                # If separate tokens like ["GJ01", "AB1234"] were recognized, combine them
                if not best_candidate and len(all_detected_tokens) >= 2:
                    joined = "".join([t["clean"] for t in all_detected_tokens])
                    m = re.search(r'([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4})', joined)
                    if m:
                        best_candidate = m.group(1)
            except Exception as e:
                print(f"[!] EasyOCR read_full_image error: {e}")

        # Fallback if no candidate found via OCR: check any alphanumeric token
        if not best_candidate and all_detected_tokens:
            best_candidate = all_detected_tokens[0]["clean"]

        return {
            "found": bool(best_candidate),
            "candidate": best_candidate or "",
            "tokens": all_detected_tokens
        }