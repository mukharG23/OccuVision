import threading
import queue
import base64
import numpy as np
import cv2
import mediapipe as mp
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared Resources ──────────────────────────────────────────────────────
frame_queue_face = queue.Queue(maxsize=5)
frame_queue_yolo = queue.Queue(maxsize=5)
results = {}
results_lock = threading.Lock()

# ── MediaPipe Setup ───────────────────────────────────────────────────────
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(min_detection_confidence=0.6)

# ── Request Model ─────────────────────────────────────────────────────────
class FrameData(BaseModel):
    frame: str

# ── Thread B: Face Detection ──────────────────────────────────────────────
def thread_b_face():
    frame_count = 0

    while True:
        try:
            frame = frame_queue_face.get(timeout=1)
        except queue.Empty:
            continue  # no frame available yet, loop and wait

        frame_count += 1
        if frame_count % 3 != 0:
            continue  # process every 3rd frame only

        # MediaPipe expects RGB, OpenCV gives BGR — convert
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        detection_results = face_detector.process(rgb_frame)

        boxes = []
        if detection_results.detections:
            h, w = frame.shape[:2]  # actual pixel dimensions

            for detection in detection_results.detections:
                bbox = detection.location_data.relative_bounding_box

                # Convert fractions → actual pixel coordinates
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                bw = int(bbox.width * w)
                bh = int(bbox.height * h)

                # Clamp to frame boundaries — prevents negative coordinates
                x = max(0, x)
                y = max(0, y)

                boxes.append({
                    "x": x,
                    "y": y,
                    "width": bw,
                    "height": bh
                })

        # Write to shared results dict — protected by lock
        with results_lock:
            results["faces"] = boxes

# ── Thread C: YOLO (empty for now) ───────────────────────────────────────
def thread_c_yolo():
    pass

# ── Start Threads on Startup ──────────────────────────────────────────────
@app.on_event("startup")
def start_threads():
    threading.Thread(target=thread_b_face, daemon=True).start()
    threading.Thread(target=thread_c_yolo, daemon=True).start()

# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "SentinelAI backend is running"}

@app.post("/frame")
def receive_frame(data: FrameData):
    try:
        header, encoded = data.frame.split(",", 1)
    except ValueError:
        return {"status": "error", "message": "Invalid frame format"}

    img_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"status": "error", "message": "Could not decode image"}

    try:
        frame_queue_face.put_nowait(frame)
    except queue.Full:
        pass

    try:
        frame_queue_yolo.put_nowait(frame)
    except queue.Full:
        pass

    return {"status": "ok"}

@app.get("/results")
def get_results():
    with results_lock:
        return dict(results)