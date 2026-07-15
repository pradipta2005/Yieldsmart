"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CameraCapture from "@/components/CameraCapture";
import { apiDetect, DiseaseResult } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { UploadCloud, Camera, CheckCircle2, AlertTriangle, XCircle, Beaker, Shield, Activity, RefreshCw, ScanLine } from "lucide-react";

const SEV_COLOR: Record<string, string> = {
  none: "var(--success)", moderate: "var(--warning)",
  severe: "var(--danger)", critical: "var(--danger)",
};
const SEV_LABEL: Record<string, string> = {
  none: "Healthy", moderate: "Moderate", severe: "Severe", critical: "Critical",
};
const STEPS = [
  "Preprocessing image...",
  "Running neural network...",
  "Matching disease patterns...",
  "Compiling treatment report...",
];

function ProgressBar({ value, color = "var(--success)" }: { value: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 300); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 99, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

export default function DiseasePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [step, setStep] = useState(0);
  const [isAuth, setIsAuth] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    setIsAuth(true);
  }, [router]);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload a JPG or PNG image."); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
    setResult(null); setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setError(null); setStep(0);
    const iv = setInterval(() => setStep(s => s < STEPS.length - 1 ? s + 1 : s), 750);
    try {
      const res = await apiDetect(file);
      clearInterval(iv); setStep(STEPS.length); setResult(res);
    } catch (e: unknown) {
      clearInterval(iv); setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setStep(0); setLoading(false); };

  const handleCameraCapture = useCallback((f: File) => {
    handleFile(f);
  }, [handleFile]);

  if (!isAuth) return null;
  const sev = result?.disease_info.severity || "none";
  const sevColor = SEV_COLOR[sev];

  return (
    <>
      <Navbar />
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div className="premium-mesh-glow-1" />
        <div className="premium-mesh-glow-2" />
        <main className="app-page-container" style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-primary)", marginBottom: 8 }}>AI Scanner</div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 700, letterSpacing: "-0.03em", fontFamily: "var(--font-display)", marginBottom: 6, color: "var(--text-primary)" }}>
            Plant Disease Scanner
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 520, lineHeight: 1.6 }}>
            Upload a clear photo of a leaf. Our AI identifies the disease and gives you a detailed treatment plan with easy-to-follow prevention steps.
          </p>
        </div>

        <div className={`scanner-grid ${result || loading ? "active-result" : ""}`}>

          {/* ── Left: Upload ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {!preview ? (
              <div
                className={`upload-zone ${drag ? "drag-active" : ""}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="upload-icon-container">
                  <UploadCloud size={28} />
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Drop your leaf photo here
                </div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginBottom: 28, lineHeight: 1.6 }}>
                  Supports JPG and PNG · Up to 10 MB
                </div>

                {/* Action buttons row */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  {/* Browse files */}
                  <button
                    className="btn btn-secondary"
                    style={{ pointerEvents: "none" }}
                  >
                    <UploadCloud size={15} /> Browse Files
                  </button>

                  {/* Camera capture button */}
                  <button
                    className="btn"
                    style={{
                      pointerEvents: "auto",
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                    }}
                    onClick={e => { e.stopPropagation(); setShowCamera(true); }}
                  >
                    <Camera size={15} /> Take Photo
                  </button>
                </div>

                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="app-card premium-glass-card app-card-accent-emerald" style={{ padding: 0 }}>
                <div style={{ position: "relative", background: "rgba(0,0,0,0.5)", maxHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src={preview} alt="Leaf" width={600} height={320}
                    style={{ width: "100%", height: 300, objectFit: "contain", display: "block" }} unoptimized />
                </div>
                <div style={{ padding: "16px 20px", display: "flex", gap: 10, borderTop: "1px solid var(--border-subtle)" }}>
                  <button
                    onClick={analyze} disabled={loading}
                    className="btn btn-primary"
                    style={{
                      flex: 1, padding: "12px", cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {loading
                      ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analyzing...</>
                      : <><ScanLine size={16} /> Analyze Image</>}
                  </button>
                  <button
                    onClick={reset} disabled={loading}
                    className="btn btn-secondary"
                    style={{ padding: "12px 20px" }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Analysis steps */}
            {loading && (
              <div className="app-card premium-glass-card app-card-accent-blue">
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  <Activity size={16} color="var(--accent-primary)" /> Analysing your leaf…
                </div>
                {STEPS.map((s, i) => (
                  <div key={s} className={`step-item ${i > step ? "inactive" : ""}`}>
                    {i < step
                      ? <CheckCircle2 size={16} color="var(--success)" />
                      : i === step
                        ? <div className="spinner" style={{ width: 14, height: 14, borderColor: "var(--border-subtle)", borderTopColor: "var(--accent-primary)" }} />
                        : <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--border-subtle)" }} />}
                    <span style={{ fontSize: "0.875rem", color: i <= step ? "var(--text-primary)" : "var(--text-tertiary)" }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <XCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--danger)", fontSize: "0.875rem" }}>Analysis Failed</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 3 }}>{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Result ── */}
          {result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={`app-card premium-glass-card ${sev === "none" ? "app-card-accent-emerald" : sev === "moderate" ? "app-card-accent-yellow" : "app-card-accent-red"}`} style={{ padding: 0, borderColor: sevColor + "30" }}>

                {/* Result header */}
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-tertiary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: 10 }}>
                        Detection Result
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 6 }}>
                        {result.disease_info.display}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                        padding: "4px 12px", borderRadius: 4,
                        background: sevColor + "12", color: sevColor, border: `1px solid ${sevColor}25`,
                      }}>{SEV_LABEL[sev]}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "2.25rem", fontWeight: 600, color: sevColor, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{result.confidence}%</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confidence</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* Quality Warning */}
                  {result.warning && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, background: "var(--warning-bg)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--warning)", fontSize: "0.82rem", marginBottom: 3 }}>Image Quality Alert</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{result.warning}</div>
                      </div>
                    </div>
                  )}

                  {/* Healthy celebration */}
                  {sev === "none" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, background: "var(--success-bg)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--success)", fontSize: "0.875rem", marginBottom: 3 }}>Your plant is healthy!</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>Keep up your current care routine.</div>
                      </div>
                    </div>
                  )}

                  {/* Cause & Symptoms */}
                  {sev !== "none" && (
                    <>
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                          <Activity size={13} /> Cause &amp; Symptoms
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 10 }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Cause: </span>{result.disease_info.cause}
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Symptoms: </span>{result.disease_info.symptoms}
                        </p>
                      </div>

                      {result.disease_info.treatments.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <Beaker size={13} /> Treatment Plan
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result.disease_info.treatments.map((t, i) => (
                              <div key={i} style={{ padding: "12px 14px", background: "transparent", borderLeft: `2px solid ${sevColor}`, borderTop: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", borderRadius: 8 }}>
                                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 6, color: "var(--text-primary)" }}>{t.method}</div>
                                <div style={{ display: "flex", gap: 16, fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                                  {t.ratio && <span>RATIO: {t.ratio}</span>}
                                  {t.frequency && <span>FREQ: {t.frequency}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.disease_info.prevention.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <Shield size={13} /> Prevention Tips
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result.disease_info.prevention.map((p, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: 2 }}>{`[${(i + 1).toString().padStart(2, "0")}]`}</span>
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Model confidence */}
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 14 }}>
                      Model Confidence
                    </div>
                    {result.top3.map((p, i) => {
                      const pct = Math.round(p.confidence * 100);
                      // Strip plant name prefix: "Apple___Black_rot" → "Black rot"
                      const rawLabel = p.label.includes("___") ? p.label.split("___")[1] : p.label;
                      const displayLabel = rawLabel.replace(/_/g, " ");
                      return (
                        <div key={p.label} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.82rem", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                              {displayLabel}
                            </span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-mono)", color: i === 0 ? sevColor : "var(--text-tertiary)" }}>{pct}%</span>
                          </div>
                          <ProgressBar value={pct} color={i === 0 ? sevColor : "var(--border-subtle)"} />
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={reset} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                    <RefreshCw size={15} /> Scan Another Leaf
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </>
  );
}

