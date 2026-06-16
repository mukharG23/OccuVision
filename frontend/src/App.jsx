import { useEffect, useRef,useState } from "react"
import { useWebcam } from "./hooks/useWebcam"

const BACKEND_URL = "http://127.0.0.1:8000"

function App() {
  const { videoRef, isActive, stop, start } = useWebcam()
  const canvasRef = useRef(null)
  const facesRef = useRef([])  // stores latest face boxes — updated by polling
  const [attendance, setAttendance] = useState({})

  // ── Polling Loop: fetch results every 500ms ───────────────────────────
  useEffect(() => {
    if (!isActive) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/results`)
        const data = await res.json()
        facesRef.current = data.faces || []
      } catch (err) {
        // backend down or slow — keep last known boxes
      }
    }, 500)

    return () => clearInterval(pollInterval)
  }, [isActive])


  useEffect(() => {
    if (!isActive) return

    const pollAttendance = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/attendance`)
        const data = await res.json()
        setAttendance(data)
      } catch (err) {
        // backend down — keep last known attendance
      }
    }, 1000)

    return () => clearInterval(pollAttendance)
  }, [isActive])

  // ── Drawing Loop: redraw canvas at 60 FPS ─────────────────────────────
  useEffect(() => {
    if (!isActive) return

    let animFrameId = null

    const draw = () => {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (canvas && video) {
        const ctx = canvas.getContext("2d")

        // Match canvas size to video size
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        // Clear previous frame's boxes
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw each face box
        facesRef.current.forEach(face => {
          const isKnown = face.confirmed === true
          const color = isKnown ? "#00FF00" : "#FF0000"
          const label = isKnown ? face.name : "Unknown"
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(face.x, face.y, face.width, face.height)

          // Label above the box
          ctx.fillStyle = color
          ctx.font = "14px Arial"
          ctx.fillText(label, face.x, face.y - 5)
        })
      }

      animFrameId = requestAnimationFrame(draw)  // loop
    }

    animFrameId = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(animFrameId)
  }, [isActive])

  return (
    <div style={{ display: "flex", gap: "24px" }}>

      {/* Left side: video + controls */}
      <div>
        <h1>SentinelAI</h1>
        <div style={{ position: "relative", display: "inline-block" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width={640}
            height={480}
            style={{ display: "block" }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none"
            }}
          />
        </div>

        <br />
        {isActive
          ? <button onClick={() => {
              facesRef.current = []
              const canvas = canvasRef.current
              if (canvas) {
                const ctx = canvas.getContext("2d")
                ctx.clearRect(0, 0, canvas.width, canvas.height)
              }
              stop()
            }}>Stop Camera</button>
          : <button onClick={start}>Start Camera</button>
        }
      </div>

      {/* Right side: attendance sidebar */}
      <div style={{ minWidth: "250px" }}>
        <h2>Today's Attendance</h2>
        {Object.keys(attendance).length === 0 ? (
          <p>No one recognized yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {Object.entries(attendance).map(([name, times]) => (
              <li key={name} style={{
                marginBottom: "12px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px"
              }}>
                <strong>{name}</strong>
                <br />
                First seen: {times.first_seen}
                <br />
                Last seen: {times.last_seen}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}

export default App