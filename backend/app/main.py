import threading
import queue
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ── CORS — allow React frontend to talk to this backend ───────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared Resources ──────────────────────────────────────────────────────
frame_queue_face = queue.Queue(maxsize=5)
frame_queue_yolo = queue.Queue(maxsize=5)
results = {}
results_lock = threading.Lock()

# ── Thread Functions ──────────────────────────────────────────────────────
def thread_a_capture():
    pass  # filled in W1T3

def thread_b_face():
    pass  # filled in Week 3

def thread_c_yolo():
    pass  # filled in Week 5

# ── Start Threads on Startup ──────────────────────────────────────────────
@app.on_event("startup")
def start_threads():
    threading.Thread(target=thread_b_face, daemon=True).start()
    threading.Thread(target=thread_c_yolo, daemon=True).start()

# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "SentinelAI backend is running"}