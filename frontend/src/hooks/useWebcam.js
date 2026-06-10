import { useEffect, useRef, useState } from "react"

const BACKEND_URL = "http://127.0.0.1:8000"
const FPS = 15
const INTERVAL_MS = Math.round(1000 / FPS)

export function useWebcam() {
  const videoRef = useRef(null)
  const isStreamingRef = useRef(false)
  const [isActive, setIsActive] = useState(true)  // true = webcam on

  useEffect(() => {
    if (!isActive) return  // if stopped, do nothing

    let intervalId = null
    let stream = null

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        intervalId = setInterval(() => {
          captureAndSend(videoRef, isStreamingRef)
        }, INTERVAL_MS)
      })
      .catch((err) => {
        console.error("Webcam access denied or unavailable:", err)
      })

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (stream) stream.getTracks().forEach(track => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [isActive])  // re-runs when isActive changes

  const stop = () => setIsActive(false)
  const start = () => setIsActive(true)

  return { videoRef, isActive, stop, start }
}

async function captureAndSend(videoRef, isStreamingRef) {
  if (isStreamingRef.current) return

  const video = videoRef.current
  if (!video || video.readyState !== 4) return

  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext("2d")
  ctx.drawImage(video, 0, 0)

  const base64Frame = canvas.toDataURL("image/jpeg", 0.7)

  isStreamingRef.current = true
  try {
    await fetch(`${BACKEND_URL}/frame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame: base64Frame })
    })
  } catch (err) {
    console.warn("Frame dropped:", err.message)
  } finally {
    isStreamingRef.current = false
  }
}