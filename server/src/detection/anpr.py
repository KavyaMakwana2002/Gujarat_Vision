import cv2
import gc

try:
    import easyocr
    import torch
    HAS_EASYOCR = True
except ImportError:
    HAS_EASYOCR = False
    easyocr = None
    torch = None

class LicensePlateReader:
    def __init__(self):
        # Lazy load EasyOCR reader on demand to save ~300MB RAM at startup
        self.reader = None
        self._init_attempted = False

    def _get_reader(self):
        if not HAS_EASYOCR:
            return None
            
        if self.reader is None and not self._init_attempted:
            self._init_attempted = True
            try:
                # Memory guard: Check available RAM on Linux / Render
                try:
                    import psutil
                    avail_mb = psutil.virtual_memory().available / (1024 * 1024)
                    if avail_mb < 180:
                        print(f"[!] Warning: Available memory ({avail_mb:.1f}MB) is too low for EasyOCR. Skipping OCR initialization to prevent OOM crash.")
                        return None
                except Exception:
                    pass

                use_gpu = torch.cuda.is_available() if torch else False
                print(f"[*] ANPR (EasyOCR) Model loading on demand... (GPU={use_gpu})")
                self.reader = easyocr.Reader(['en'], gpu=use_gpu)
                print("[+] ANPR (EasyOCR) Engine successfully initialized!")
                gc.collect()
            except Exception as e:
                print(f"[!] Warning: EasyOCR reader initialization failed: {e}")
                self.reader = None

        return self.reader

    def read_plate(self, image_crop):
        reader = self._get_reader()
        if not reader or image_crop is None or image_crop.size == 0:
            return ""
        try:
            # Cropped image (khali number plate no bhag) mathi text read karshe
            results = reader.readtext(image_crop)
            
            detected_text = ""
            for (bbox, text, prob) in results:
                # Jo 50% thi vadhare sure hoy to j text ne consider karshe
                if prob > 0.5:
                    clean_text = "".join(e for e in text if e.isalnum())
                    detected_text += clean_text + " "
                    
            return detected_text.strip()
        except Exception as e:
            print(f"[!] ANPR read error: {e}")
            return ""