# OccuVision

A real-time workspace intelligence dashboard that processes live webcam feeds to detect and recognize faces, track attendance, monitor zone occupancy, detect office objects, and generate natural language scene summaries.

---

## Features

- **Face Detection** — MediaPipe BlazeFace detects faces in real-time at 30fps
- **Face Recognition** — 128D embeddings via `face_recognition`, Euclidean distance matching
- **Attendance Logging** — Automatic First Seen / Last Seen timestamps, daily JSON rotation
- **Object Detection** — YOLOv8n detects office objects (laptop, chair, phone, etc.)
- **Zone Counting** — Click-drag to define zones, live occupancy count per zone
- **Centroid Tracking** — Unique IDs assigned to tracked persons across frames
- **Unknown Face Alerts** — Triggers after 5 seconds of unrecognized face, 30s global cooldown
- **VLM Scene Narration** — Groq API generates natural language room summaries every 10 seconds
- **Dark/Light Mode** — UI toggle
- **Docker Support** — One-command deployment via docker-compose

---

## Architecture

```
Browser (React + Vite)
│
│  getUserMedia() → 15 FPS Base64 frames → POST /frame
│  GET /results ← bounding boxes, labels, narration, alerts
│
FastAPI Backend (Uvicorn)
│
├── Thread A — Frame capture, feeds two queues
├── Thread B — MediaPipe detection → face_recognition matching (every 3rd frame)
└── Thread C — YOLOv8n inference → CentroidTracker (every 5th frame)
│
├── known_faces.json     — registered face embeddings
├── attendance_*.json    — daily attendance logs
└── zones.json           — zone definitions
│
└── Groq API (openai/gpt-oss-20b) — scene narration
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), HTML5 Canvas |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| Face Detection | MediaPipe 0.10.11 |
| Face Recognition | face_recognition, dlib 19.24.1 |
| Object Detection | YOLOv8n (Ultralytics) |
| VLM Narration | Groq API |
| Storage | JSON flat-files |
| DevOps | Docker, docker-compose |

---

## Running with Docker (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Steps

```bash
git clone https://github.com/mukharG23/OccuVision.git
cd OccuVision
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Then:
```bash
docker-compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## Running Locally

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate

# Install dlib prebuilt wheel first (Windows only)
pip install https://github.com/sachadee/Dlib/raw/main/dlib-19.24.1-cp311-cp311-win_amd64.whl
pip install numpy==1.26.4
pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

---

## Registering a Face

1. Open http://localhost:5173
2. Use the registration panel — enter a name and upload a clear face photo
3. The backend generates a 128D embedding and saves it to `known_faces.json`
4. Recognition is active immediately — no restart needed

---

## Known Compatibility Issues

| Issue | Fix |
|-------|-----|
| `numpy` must be pinned to `1.26.4` | `dlib 19.24.1` breaks on numpy 2.x with a misleading "Unsupported image type" error |
| `mediapipe` must be `0.10.11` | Newer versions removed the `mp.solutions` API |
| `dlib` on Windows requires a prebuilt wheel | Source compilation requires Visual C++ build tools; use sachadee's prebuilt wheel instead |
| `ultralytics` silently upgrades numpy to 2.x | Always run `pip install numpy==1.26.4` after installing ultralytics |
| Groq model `llama3-8b-8192` is decommissioned | Use `openai/gpt-oss-20b` |
| `face_recognition.face_encodings()` with `known_face_locations` crashes on this dlib build | Pass cropped face region directly instead |

---

## Known Limitations

- Zone deletion requires manually editing `zones.json` — no UI for it
- Centroid tracker IDs reset when a person leaves and re-enters the frame
- Docker image is large (~18GB) due to PyTorch dependency pulled in by Ultralytics
- Unknown face alert uses a single global cooldown — not per-identity

---

## Author

[mukharG23](https://github.com/mukharG23)