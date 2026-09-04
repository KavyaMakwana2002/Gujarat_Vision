# Sentinel Shield 2.4 — AI Surveillance Backend Dockerfile
FROM python:3.10-slim

# Install system dependencies for OpenCV and FFMPEG
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY . .

# Force RTSP over TCP
ENV OPENCV_FFMPEG_CAPTURE_OPTIONS="rtsp_transport;tcp"
ENV PORT=8000
ENV HOST="0.0.0.0"

EXPOSE 8000

# Start FastAPI server
CMD ["python", "run_server.py"]