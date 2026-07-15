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
  const capturedUrlRef = useRef<string | null>(null); // track for cleanup

  const [mode, setMode] = useState<"live" | "preview">("live");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [starting, setStarting] = useState(true);

  /* ── helpers ─────────────────────────────────────────────────── */
  const revokePreview = () => {
    if (capturedUrlRef.current) {
      URL.revokeObjectURL(capturedUrlRef.current);
      capturedUrlRef.current = null;
    }
  };

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

  // Mount — start camera, unmount — release stream + url
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      revokePreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = useCallback((currentFacing: "environment" | "user") => {
    const next = currentFacing === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }, [startCamera]);

  const capture = useCallback((currentFacing: "environment" | "user") => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // Mirror the canvas if using front camera (so saved image matches preview)
    if (currentFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `leaf-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      revokePreview();
      const url = URL.createObjectURL(blob);
      capturedUrlRef.current = url;
      setCapturedFile(file);
      setCapturedUrl(url);
      setMode("preview");
      // Stop camera stream after capture
      streamRef.current?.getTracks().forEach(t => t.stop());
    }, "image/jpeg", 0.92);
  }, []);

  const retake = useCallback((currentFacing: "environment" | "user") => {
    revokePreview();
    setCapturedUrl(null);
    setCapturedFile(null);
    setMode("live");
    startCamera(currentFacing);
  }, [startCamera]);

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
      background: "#000",
      display: "flex", flexDirection: "column",
      animation: "cameraModalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: "rgba(255,255,255,0.75)",
          pointerEvents: "none",
          transition: "opacity 0.15s",
        }} />
      )}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        zIndex: 5, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Camera size={15} color="#10b981" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>Live Camera</div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
              {mode === "live" ? "Point at the affected leaf · tap shutter to capture" : "Review — retake or proceed to analysis"}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close camera"
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.55)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#000" }}>

        {/* ── Live mode ── */}
        {mode === "live" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                display: starting ? "none" : "block",
                // Mirror CSS only for selfie — actual capture ctx.scale corrects it
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />

            {/* Loading spinner */}
            {starting && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "rgba(255,255,255,0.45)" }}>
                <div className="spinner" style={{ width: 38, height: 38, borderColor: "rgba(255,255,255,0.08)", borderTopColor: "#10b981" }} />
                <span style={{ fontSize: "0.82rem", letterSpacing: "0.04em" }}>Starting camera…</span>
              </div>
            )}

            {/* Permission error */}
            {error && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                padding: "32px 24px", textAlign: "center", maxWidth: 320,
              }}>
                <ZapOff size={44} color="rgba(239,68,68,0.55)" />
                <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.9rem" }}>Camera Unavailable</div>
                <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.8rem", lineHeight: 1.65 }}>{error}</div>
                <button onClick={() => startCamera(facingMode)} className="btn btn-secondary" style={{ marginTop: 6 }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Overlay: viewfinder brackets + scan line */}
            {!starting && !error && (
              <>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: "min(88%, 440px)", aspectRatio: "4/3" }}>
                    {/* Corner brackets */}
                    {[
                      { top: 0, left: 0, borderTop: "2.5px solid #10b981", borderLeft: "2.5px solid #10b981", borderTopLeftRadius: 5 },
                      { top: 0, right: 0, borderTop: "2.5px solid #10b981", borderRight: "2.5px solid #10b981", borderTopRightRadius: 5 },
                      { bottom: 0, left: 0, borderBottom: "2.5px solid #10b981", borderLeft: "2.5px solid #10b981", borderBottomLeftRadius: 5 },
                      { bottom: 0, right: 0, borderBottom: "2.5px solid #10b981", borderRight: "2.5px solid #10b981", borderBottomRightRadius: 5 },
                    ].map((s, i) => (
                      <div key={i} style={{ position: "absolute", width: 30, height: 30, ...s }} />
                    ))}

                    {/* Animated scan line */}
                    <div style={{
                      position: "absolute", left: 4, right: 4, height: 1.5,
                      background: "linear-gradient(90deg, transparent 0%, #10b981 40%, #6ee7b7 50%, #10b981 60%, transparent 100%)",
                      animation: "scanLine 2s ease-in-out infinite",
                      boxShadow: "0 0 10px rgba(16,185,129,0.6)",
                      borderRadius: 2,
                    }} />

                    {/* Hint label */}
                    <div style={{
                      position: "absolute", bottom: -30, left: 0, right: 0,
                      textAlign: "center", fontSize: "0.68rem", fontWeight: 500,
                      color: "rgba(255,255,255,0.42)", letterSpacing: "0.09em", textTransform: "uppercase",
                    }}>
                      <Scan size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                      Align leaf within frame
                    </div>
                  </div>
                </div>

                {/* Vignette */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.5) 100%)",
                }} />
              </>
            )}
          </>
        )}

        {/* ── Preview mode ── */}
        {mode === "preview" && capturedUrl && (
          <img
            src={capturedUrl}
            alt="Captured leaf"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Controls bar */}
      <div style={{
        padding: "20px 28px 28px",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
        flexShrink: 0,
      }}>
        {mode === "live" ? (
          <>
            {/* Flip camera */}
            <button
              onClick={() => flipCamera(facingMode)}
              disabled={starting || !!error}
              aria-label="Flip camera"
              style={{
                width: 50, height: 50, borderRadius: "50%",
                background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: starting || !!error ? "not-allowed" : "pointer",
                color: "rgba(255,255,255,0.65)",
                transition: "all 0.18s",
                opacity: starting || !!error ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!starting && !error) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.16)"; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"}
            >
              <FlipHorizontal size={20} />
            </button>

            {/* Shutter */}
            <button
              onClick={() => capture(facingMode)}
              disabled={starting || !!error}
              aria-label="Capture photo"
              style={{
                width: 74, height: 74, borderRadius: "50%",
                background: "#fff",
                border: "4px solid rgba(255,255,255,0.18)",
                boxShadow: "0 0 0 3px rgba(16,185,129,0.55), 0 8px 32px rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: starting || !!error ? "not-allowed" : "pointer",
                transition: "transform 0.12s ease, box-shadow 0.12s ease",
                opacity: starting || !!error ? 0.35 : 1,
              }}
              onMouseEnter={e => { if (!starting && !error) { (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"; } }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
              onMouseDown={e => { if (!starting && !error) (e.currentTarget as HTMLElement).style.transform = "scale(0.92)"; }}
              onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
            >
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#fff", border: "2px solid rgba(0,0,0,0.07)" }} />
            </button>

            {/* Cancel */}
            <button
              onClick={onClose}
              aria-label="Cancel"
              style={{
                width: 50, height: 50, borderRadius: "50%",
                background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.65)",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
            >
              <X size={20} />
            </button>
          </>
        ) : (
          /* Preview controls */
          <>
            <button
              onClick={() => retake(facingMode)}
              className="btn btn-secondary"
              style={{ padding: "12px 30px", borderRadius: 99, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}
            >
              <RefreshCw size={15} /> Retake
            </button>
            <button
              onClick={confirm}
              aria-label="Use this photo for analysis"
              style={{
                padding: "13px 36px", borderRadius: 99, fontSize: "0.875rem", fontWeight: 700,
                background: "#10b981", color: "#000",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 22px rgba(16,185,129,0.4)",
                transition: "transform 0.13s, box-shadow 0.13s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(16,185,129,0.55)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 22px rgba(16,185,129,0.4)"; }}
            >
              <Scan size={16} /> Use this Photo
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes cameraModalIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes scanLine {
          0%   { top: 2%; }
          50%  { top: calc(98% - 1px); }
          100% { top: 2%; }
        }
      `}</style>
    </div>
  );
}
