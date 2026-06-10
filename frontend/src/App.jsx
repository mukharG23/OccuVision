import { useWebcam } from "./hooks/useWebcam"

function App() {
  const { videoRef, isActive, stop, start } = useWebcam()

  return (
    <div>
      <h1>SentinelAI</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={640}
        height={480}
      />
      <br />
      {isActive
        ? <button onClick={stop}>Stop Camera</button>
        : <button onClick={start}>Start Camera</button>
      }
    </div>
  )
}

export default App