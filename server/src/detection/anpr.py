import cv2

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
        self.reader = None
        if HAS_EASYOCR:
            try:
                use_gpu = torch.cuda.is_available() if torch else False
                print(f"[*] ANPR (EasyOCR) Model loading... (GPU={use_gpu})")
                self.reader = easyocr.Reader(['en'], gpu=use_gpu)
                print("[+] ANPR (EasyOCR) Engine successfully initialized!")
            except Exception as e:
                print(f"[!] Warning: EasyOCR initialization deferred: {e}")
        else:
            print("[!] Warning: easyocr module not found. Falling back to passive detection mode.")

    def read_plate(self, image_crop):
        if not self.reader or image_crop is None or image_crop.size == 0:
            return ""
        try:
            # Cropped image (khali number plate no bhag) mathi text read karshe
            results = self.reader.readtext(image_crop)
            
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