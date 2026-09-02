import os
import sys
import uvicorn

# Memory optimizations for Linux cloud environments (Render 512MB limit)
os.environ.setdefault("MALLOC_ARENA_MAX", "2")
os.environ.setdefault("PYTHONMALLOC", "malloc")
os.environ.setdefault("YOLO_CONFIG_DIR", "/tmp/Ultralytics")

# Ensure both server/ and project root are in sys.path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    is_dev = os.environ.get("RENDER") is None
    print(f"[*] Starting Sentinel Shield 2.4 AI Backend on http://{host}:{port} (Reload: {is_dev})")
    uvicorn.run("src.backend.main:app", host=host, port=port, reload=is_dev, workers=1)
