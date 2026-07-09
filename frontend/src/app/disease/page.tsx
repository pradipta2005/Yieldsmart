"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { apiDetect, DiseaseResult } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { UploadCloud, CheckCircle2, AlertTriangle, XCircle, Beaker, Shield, Activity, RefreshCw, ScanLine, Leaf } from "lucide-react";

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
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
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

  if (!isAuth) return null;
  const sev = result?.disease_info.severity || "none";
  const sevColor = SEV_COLOR[sev];

  return (
    <>
      <Navbar />
      <main className="app-page-container">

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-primary)", marginBottom: 8 }}>AI Scanner</div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 700, letterSpacing: "-0.03em", fontFamily: "var(--font-display)", marginBottom: 6, color: "var(--text-primary)" }}>
            Plant Disease Scanner
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 520, lineHeight: 1.6 }}>
            Upload a clear photo of a leaf. Our neural network identifies the disease across 38 plant types and prescribes a treatment plan.
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
                <button className="btn btn-secondary" style={{ pointerEvents: "none" }}>
                  Browse Files
                </button>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="app-card" style={{ padding: 0 }}>
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
              <div className="app-card">
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
              <div className="app-card" style={{ padding: 0, borderColor: sevColor + "30" }}>

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
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Leaf size={13} color="var(--text-tertiary)" />
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{result.disease_info.plant}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                        padding: "4px 12px", borderRadius: 99,
                        background: sevColor + "18", color: sevColor, border: `1px solid ${sevColor}30`,
                      }}>{SEV_LABEL[sev]}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: sevColor, lineHeight: 1, fontFamily: "var(--font-display)" }}>{result.confidence}%</div>
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
                              <div key={i} style={{ padding: "14px 16px", background: "var(--bg-tertiary)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 6, color: "var(--text-primary)" }}>{t.method}</div>
                                <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                                  {t.ratio && <span>Ratio: {t.ratio}</span>}
                                  {t.frequency && <span>Freq: {t.frequency}</span>}
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
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {result.disease_info.prevention.map((p, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", marginTop: 7, flexShrink: 0, opacity: 0.7 }} />
                                {p}
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
                      return (
                        <div key={p.label} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: "0.82rem", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                              {p.label.replace(/___/g, " — ").replace(/_/g, " ")}
                            </span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: i === 0 ? sevColor : "var(--text-tertiary)" }}>{pct}%</span>
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
    </>
  );
}
