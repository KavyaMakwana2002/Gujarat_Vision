import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import datetime
import os

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "gujarattrafficpolice.demo@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "your_app_password_here")

def send_echallan_email(plate_number: str, speed: float, location: str, vehicle_type: str, timestamp: str, recipient_email: str):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"🚨 E-Challan Notice: Speeding Violation Detected ({plate_number})"
    msg['From'] = f"Gujarat Traffic Police <{SMTP_USER}>"
    msg['To'] = recipient_email

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">GUJARAT TRAFFIC POLICE</h2>
            <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 14px;">Automated Speed Enforcement Division</p>
          </div>
          
          <div style="padding: 30px;">
            <h3 style="color: #1f2937; margin-top: 0;">E-Challan Notice: Overspeeding</h3>
            <p style="color: #4b5563; line-height: 1.6;">
              Dear Citizen,<br><br>
              This is to inform you that your vehicle (<strong>{vehicle_type}</strong>) bearing registration number 
              <strong style="color: #b91c1c;">{plate_number}</strong> has been detected violating the speed limit 
              on the public network.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Date & Time</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold;">{timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Location</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold;">{location}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Detected Speed</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #b91c1c; font-weight: bold; font-size: 18px;">{speed} km/h</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Allowed Limit</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold;">60 km/h</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #64748b; font-size: 14px;">Fine Amount</td>
                <td style="padding: 12px 15px; color: #0f172a; font-weight: bold;">₹ 2,000.00</td>
              </tr>
            </table>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              Please pay your challan online within 15 days at the official Gujarat E-Challan portal to avoid legal action.
              <br><br>
              <a href="https://echallan.gujarat.gov.in" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">Pay E-Challan Online</a>
            </p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">This is an automatically generated email from the AI Cyber Vision Grid.</p>
            <p style="margin: 5px 0 0 0;">Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_content, 'html'))
    try:
        if SMTP_PASS == "your_app_password_here":
            print(f"[!] Simulation Mode: Sending E-Challan to {recipient_email} for {plate_number} at {speed}km/h")
            return {"status": "success", "message": "Email simulated successfully (Add credentials to send real emails)."}
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
