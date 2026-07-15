"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiHistory, HistoryData, ScanHistoryItem, DiseaseResult } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import Link from "next/link";
import { Activity, AlertCircle, ArrowRight, CheckCircle2, ScanSearch, Beaker, Shield, X } from "lucide-react";

const SEV_COLOR: Record<string, string> = {
  none: "var(--success)", moderate: "var(--warning)",
  severe: "var(--danger)", critical: "var(--danger)",
};
const SEV_BG: Record<string, string> = {
  none: "rgba(16,185,129,0.08)", moderate: "rgba(245,158,11,0.08)",
  severe: "rgba(239,68,68,0.08)", critical: "rgba(239,68,68,0.08)",
};
const SEV_BORDER: Record<string, string> = {
  none: "rgba(16,185,129,0.2)", moderate: "rgba(245,158,11,0.2)",
  severe: "rgba(239,68,68,0.2)", critical: "rgba(239,68,68,0.2)",
};
const SEV_LABEL: Record<string, string> = {
  none: "Healthy", moderate: "Moderate", severe: "Severe", critical: "Critical",
};

function formatDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    apiHistory()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="app-page-container">

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-primary)", marginBottom: 8 }}>Your Records</div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 700, letterSpacing: "-0.03em", fontFamily: "var(--font-display)", marginBottom: 6, color: "var(--text-primary)" }}>
            Scan History
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Track the health of your crops over time.
          </p>
        </div>

        {/* Stats */}
        {data && (
          <div className="history-stats-grid">
            {[
              { icon: <ScanSearch size={20} />, label: "Total Scans", val: data.stats.total_scans, color: "var(--text-primary)", bg: "var(--bg-secondary)", border: "var(--border-subtle)" },
              { icon: <AlertCircle size={20} />, label: "Diseases Found", val: data.stats.diseases_found, color: "var(--warning)", bg: "var(--warning-bg)", border: "rgba(245,158,11,0.15)" },
              { icon: <CheckCircle2 size={20} />, label: "Healthy Plants", val: data.stats.healthy, color: "var(--success)", bg: "var(--success-bg)", border: "rgba(16,185,129,0.15)" },
            ].map((s, i) => (
              <div key={i} className="app-card" style={{ background: s.bg, borderColor: s.border }}>
                <div style={{ color: s.color, marginBottom: 16, opacity: 0.7 }}>{s.icon}</div>
                <div style={{ fontSize: "2rem", fontWeight: 600, color: s.color, lineHeight: 1, fontFamily: "var(--font-mono)", marginBottom: 6 }}>{s.val}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={18} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: 600, color: "var(--danger)", fontSize: "0.875rem" }}>Failed to load history</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 3 }}>{error}</div>
            </div>
          </div>
        )}

        {/* History list */}
        {!loading && data && (
          data.history.length > 0 ? (
            <div className="app-card" style={{ padding: 0 }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>Recent Scans</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 99, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                  {data.history.length} records
                </span>
              </div>

              <div>
                {data.history.map((item) => {
                  const sev = item.severity as string;
                  return (
                    <div
                      key={item.id}
                      className="history-item-row"
                      onClick={() => setSelectedScan(item)}
                    >
                      {/* Severity dot icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: SEV_BG[sev] || "var(--bg-tertiary)",
                        border: `1px solid ${SEV_BORDER[sev] || "var(--border-subtle)"}`,
                      }}>
                        <Activity size={18} color={SEV_COLOR[sev] || "var(--text-secondary)"} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>{item.disease}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{formatDate(item.scanned_at)}</div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                          padding: "3px 8px", borderRadius: 4,
                          background: (SEV_BG[sev] || "var(--bg-tertiary)"),
                          color: (SEV_COLOR[sev] || "var(--text-secondary)"),
                          border: `1px solid ${SEV_BORDER[sev] || "var(--border-subtle)"}`,
                        }}>
                          {SEV_LABEL[sev] || sev}
                        </span>
                        <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{formatDate(item.scanned_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="app-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <ScanSearch size={32} color="var(--text-tertiary)" style={{ opacity: 0.5 }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>No scans yet</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 28, maxWidth: 300, lineHeight: 1.6 }}>
                Head to the Disease Scanner and upload your first leaf photo. Your scan history will appear here.
              </div>
              <Link href="/disease" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: "var(--radius-full)",
                background: "var(--text-primary)", color: "var(--bg-primary)", fontWeight: 600, fontSize: "0.875rem",
                textDecoration: "none",
              }}>
                Start Scanning <ArrowRight size={16} />
              </Link>
            </div>
          )
        )}
      </main>

      {/* ── Scan Detail Modal ── */}
      {selectedScan && (() => {
        const result: DiseaseResult | null = selectedScan.result_json ? JSON.parse(selectedScan.result_json) : null;
        const info = result?.disease_info;
        const sev = (info?.severity || "none") as string;
        const sevColor = SEV_COLOR[sev];

        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
            onClick={() => setSelectedScan(null)}
          >
            <div
              style={{
                width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", borderRadius: 24,
                background: "var(--bg-secondary)", border: `1px solid var(--border-subtle)`,
                boxShadow: "var(--shadow-lg)",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-tertiary)", position: "relative" }}>
                <button
                  onClick={() => setSelectedScan(null)}
                  style={{
                    position: "absolute", top: 20, right: 20, width: 30, height: 30, borderRadius: "50%",
                    background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)"
                  }}
                >
                  <X size={14} />
                </button>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: 10 }}>Saved Diagnosis</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 6, color: "var(--text-primary)" }}>{info?.display || selectedScan.disease}</div>

                <div style={{ position: "absolute", bottom: 24, right: 28, textAlign: "right" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 4, background: sevColor + "12", color: sevColor, border: `1px solid ${sevColor}25`, marginBottom: 8, display: "inline-block" }}>
                    {SEV_LABEL[sev]}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 600, color: sevColor, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{selectedScan.confidence}%</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confidence</div>
                </div>
              </div>

              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
                {info && sev !== "none" ? (
                  <>
                    <div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 10 }}>Cause &amp; Symptoms</div>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 10 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Cause: </span>{info.cause}
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Symptoms: </span>{info.symptoms}
                      </p>
                    </div>

                    {info.organic && (
                      <div style={{ display: "inline-flex", alignSelf: "flex-start", padding: "4px 10px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, color: "var(--success)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.02em" }}>
                        ORGANIC SPECIFICATION AVAILABLE
                      </div>
                    )}

                    {info.treatments?.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <Beaker size={12} /> Treatment Plan
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {info.treatments.map((t, idx) => (
                            <div key={idx} style={{ padding: "12px 14px", background: "transparent", borderLeft: `2px solid ${sevColor}`, borderTop: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", borderRadius: 8 }}>
                              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 5, color: "var(--text-primary)" }}>{t.method}</div>
                              <div style={{ display: "flex", gap: 14, fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                                {t.ratio && <span>RATIO: {t.ratio}</span>}
                                {t.frequency && <span>FREQ: {t.frequency}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {info.prevention?.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <Shield size={12} /> Prevention Tips
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {info.prevention.map((p, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: 2 }}>{`[${(i + 1).toString().padStart(2, "0")}]`}</span>
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <CheckCircle2 size={20} color="var(--success)" />
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--success)", fontSize: "0.875rem", marginBottom: 3 }}>Healthy Plant</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>This crop was diagnosed as healthy. Continue standard cultivation practices.</div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textAlign: "right", marginTop: 4 }}>
                  Scanned on {formatDate(selectedScan.scanned_at)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
