import easyocr
import cv2

class LicensePlateReader:
    def __init__(self):
        print("ANPR (EasyOCR) Model load thai rahyu chhe... (First time time lagse)")
        # 'en' etle English text read karva mate. gpu=False rakhyu chhe jethi normal laptop ma chale
        self.reader = easyocr.Reader(['en'], gpu=True) 

    def read_plate(self, image_crop):
        # Cropped image (khali number plate no bhag) mathi text read karshe
        results = self.reader.readtext(image_crop)
        
        detected_text = ""
        for (bbox, text, prob) in results:
            # Jo 50% thi vadhare sure hoy to j text ne consider karshe
            if prob > 0.5:
                # Text mathi spaces ane special characters remove karva
                clean_text = "".join(e for e in text if e.isalnum())
                detected_text += clean_text + " "
                
        return detected_text.strip()