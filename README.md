# OccuVision

Real-time workspace intelligence — face recognition, attendance, occupancy & scene understanding.
Stack: React + FastAPI + MediaPipe + face_recognition + YOLOv8n + Groq
---
## What This Project Is

A full-stack real-time workspace intelligence dashboard. A webcam feed is processed by the backend to detect and recognize faces, track attendance, detect office objects via YOLO, count occupancy in defined zones, and (planned) generate natural language scene summaries using a Vision Language Model.

---

## Tech Stack

- **Frontend:** React (Vite), custom webcam hook, HTML5 Canvas overlay
- **Backend:** FastAPI + Uvicorn, Python threading, OpenCV
- **AI/ML:** MediaPipe (face detection), face_recognition/dlib (128D embeddings), YOLOv8n (object detection), Groq API (planned — VLM scene narration)
- **Storage:** JSON flat-files — no SQL, intentional simplicity for this scale
- **DevOps:** Monorepo, Git, Docker + docker-compose

---

## Architecture

### 3-Thread Design
- **Thread A** — Frame capture. Always running, fed by `POST /frame`, never blocked by AI inference.
- **Thread B** — Face recognition. Pulls from `frame_queue_face`, processes every 3rd frame.
- **Thread C** — YOLOv8n detection + centroid tracking + zone counting. Pulls from `frame_queue_yolo`, processes every 5th frame.
- `results{}` dict is shared between B and C — protected by `threading.Lock()`.
- Both queues have `maxsize=5` — old frames drop silently when full (backpressure, never blocks capture).

---

## Known Compatibility Issues (CRITICAL — read before touching dependencies)

### numpy must stay pinned at 1.26.4

`dlib==19.24.1` is incompatible with numpy 2.x and fails with:
RuntimeError: Unsupported image type, must be 8bit gray or RGB image.
it's purely a numpy version mismatch. Several packages we install (`ultralytics`, `opencv-contrib-python`, `jax`) request `numpy>=2.0` and will silently upgrade numpy if you `pip install` them directly without re-pinning afterward.

### mediapipe must be 0.10.11, not latest

Newer mediapipe versions removed the `mp.solutions` API entirely, breaking `mp.solutions.face_detection`.

## How to Start Servers

**Backend:**
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

**Frontend:**

cd frontend
npm run dev

---