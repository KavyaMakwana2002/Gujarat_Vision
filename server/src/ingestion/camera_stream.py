import cv2
import sys
import os

# src folder ne system path ma add karvu jethi detector import kari shakay
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.detection.detector import SentinelDetector

def start_stream(source=0):
    cap = cv2.VideoCapture(source)
    
    # AI Detector ne chalu karo
    ai = SentinelDetector()

    if not cap.isOpened():
        print("Error: Camera open nathi thai rahyo.")
        return

    print("AI Surveillance chalu thai gai chhe. Bandh karva 'q' dabavo.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # AI model ne frame aapo, te green box banavi ne frame pachi aapse
        frame_with_ai = ai.detect_objects(frame)

        # AI wali frame display karo
        cv2.imshow('Sentinel Shield - AI Detection', frame_with_ai)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_stream()


    #if __name__ == "__main__":
    #cctv_link = "rtsp://admin:password@192.168.1.100/stream" # Ahiya hackathon ni link aavse
    #start_stream(source=cctv_link) # Aa Line 39 change thashe

    #  video aave to cap = cv2.VideoCapture("data/sample_videos/traffic_road.mp4")