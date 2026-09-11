import os
from dotenv import load_dotenv

# Load the environment variables from .env
load_dotenv()

from src.alerts.mailer import send_echallan_email

if __name__ == "__main__":
    print("Testing SMTP Configuration...")
    print(f"Using Email: {os.getenv('SMTP_USER')}")
    
    # Send a test email to yourself
    response = send_echallan_email(
        plate_number="GJ-01-XX-1234",
        speed=85.5,
        location="SG Highway, Ahmedabad",
        vehicle_type="Car",
        timestamp="2026-09-11 21:30:00",
        recipient_email=os.getenv("SMTP_USER") # Sending to the same email for testing
    )
    
    if response["status"] == "success":
        print("✅ Success! The test E-Challan email was sent.")
        print(response.get("message", "Check your inbox."))
    else:
        print("❌ Error sending email:")
        print(response["message"])
