"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw, ZapOff, FlipHorizontal, Scan } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<"live" | "preview">("live");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [starting, setStarting] = useState(true);
  const [scanning, setScanning] = useState(false);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStarting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flash effect
    setFlash(true);
    setScanning(true);
    setTimeout(() => setFlash(false), 200);

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `leaf-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setCapturedFile(file);
      setCapturedUrl(url);
      setMode("preview");
      setScanning(false);

      // Stop camera stream after capture
      streamRef.current?.getTracks().forEach(t => t.stop());
    }, "image/jpeg", 0.92);
  }, []);

  const retake = useCallback(() => {
    setCapturedUrl(null);
    setCapturedFile(null);
    setMode("live");
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const confirm = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  }, [capturedFile, onCapture, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.95)",
      display: "flex", flexDirection: "column",
      animation: "cameraModalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: "rgba(255,255,255,0.7)",
          pointerEvents: "none",
        }} />
      )}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        zIndex: 5, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Camera size={16} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>Live Camera</div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
              {mode === "live" ? "Point at the affected leaf" : "Review your capture"}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Viewfinder area */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

        {/* Live video */}
        {mode === "live" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                display: starting ? "none" : "block",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
            {starting && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.5)" }}>
                <div className="spinner" style={{ width: 36, height: 36, borderColor: "rgba(255,255,255,0.1)", borderTopColor: "var(--accent-primary)" }} />
                <span style={{ fontSize: "0.875rem" }}>Starting camera…</span>
              </div>
            )}
            {error && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                padding: "32px", textAlign: "center", maxWidth: 340,
              }}>
                <ZapOff size={40} color="rgba(239,68,68,0.6)" />
                <div style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.95rem" }}>Camera Unavailable</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", lineHeight: 1.6 }}>{error}</div>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="btn btn-secondary"
                  style={{ marginTop: 8 }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Scan-line animation overlay */}
            {!starting && !error && (
              <>
                {/* Corner viewfinder brackets */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: "min(85%, 420px)", aspectRatio: "4/3" }}>
                    {/* corners */}
                    {[
                      { top: 0, left: 0, borderTop: "2px solid var(--accent-primary)", borderLeft: "2px solid var(--accent-primary)", borderTopLeftRadius: 4 },
                      { top: 0, right: 0, borderTop: "2px solid var(--accent-primary)", borderRight: "2px solid var(--accent-primary)", borderTopRightRadius: 4 },
                      { bottom: 0, left: 0, borderBottom: "2px solid var(--accent-primary)", borderLeft: "2px solid var(--accent-primary)", borderBottomLeftRadius: 4 },
                      { bottom: 0, right: 0, borderBottom: "2px solid var(--accent-primary)", borderRight: "2px solid var(--accent-primary)", borderBottomRightRadius: 4 },
                    ].map((style, i) => (
                      <div key={i} style={{ position: "absolute", width: 28, height: 28, ...style }} />
                    ))}

                    {/* Scan line */}
                    <div style={{
                      position: "absolute", left: 0, right: 0, height: 1,
                      background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)",
                      animation: "scanLine 2.2s ease-in-out infinite",
                      boxShadow: "0 0 8px rgba(16,185,129,0.5)",
                    }} />

                    {/* Center label */}
                    <div style={{
                      position: "absolute", bottom: -32, left: 0, right: 0,
                      textAlign: "center", fontSize: "0.72rem", fontWeight: 500,
                      color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}>
                      <Scan size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                      Align leaf within frame
                    </div>
                  </div>
                </div>

                {/* Dimmed border vignette */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
                }} />
              </>
            )}
          </>
        )}

        {/* Preview captured image */}
        {mode === "preview" && capturedUrl && (
          <img
            src={capturedUrl}
            alt="Captured leaf"
            style={{
              width: "100%", height: "100%",
              objectFit: "contain",
              background: "#000",
            }}
          />
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Controls */}
      <div style={{
        padding: "24px 32px 32px",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
        flexShrink: 0,
      }}>
        {mode === "live" ? (
          <>
            {/* Flip camera */}
            <button
              onClick={flipCamera}
              disabled={starting || !!error}
              title="Flip camera"
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
            >
              <FlipHorizontal size={20} />
            </button>

            {/* Shutter button */}
            <button
              onClick={capture}
              disabled={starting || !!error || scanning}
              title="Capture photo"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fff",
                border: "4px solid rgba(255,255,255,0.15)",
                boxShadow: "0 0 0 2px rgba(16,185,129,0.5), 0 8px 30px rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: starting || !!error ? "not-allowed" : "pointer",
                transition: "transform 0.12s, box-shadow 0.12s",
                opacity: starting || !!error ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!starting && !error) (e.currentTarget as HTMLElement).style.transform = "scale(1.07)"; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
              onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = "scale(0.93)"}
              onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
            >
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#fff",
                border: "2px solid rgba(0,0,0,0.08)",
              }} />
            </button>

            {/* Close placeholder for symmetry */}
            <button
              onClick={onClose}
              title="Cancel"
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
            >
              <X size={20} />
            </button>
          </>
        ) : (
          /* Preview controls */
          <>
            <button
              onClick={retake}
              className="btn btn-secondary"
              style={{ padding: "12px 28px", borderRadius: 99, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}
            >
              <RefreshCw size={16} /> Retake
            </button>
            <button
              onClick={confirm}
              style={{
                padding: "14px 40px", borderRadius: 99, fontSize: "0.9rem", fontWeight: 600,
                background: "var(--accent-primary)", color: "#000",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
            >
              <Scan size={17} /> Use this Photo
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes cameraModalIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes scanLine {
          0%   { top: 0%; }
          50%  { top: calc(100% - 1px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
