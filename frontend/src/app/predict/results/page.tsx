"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getProfile, CropFocus } from "@/lib/profile";
import { AlertTriangle, Info, Sprout, CloudRain, ThermometerSun, CheckCircle2, ArrowRight, Target } from "lucide-react";

export default function PredictResults() {
  const [loading, setLoading] = useState(true);
  const [yieldRange, setYieldRange] = useState<[number, number]>([0, 0]);
  const [confidence, setConfidence] = useState(0);
  const [crop, setCrop] = useState<CropFocus | "Mixed / General">("Mixed / General");

  useEffect(() => {
    // Simulate AI Prediction Processing
    const timer = setTimeout(() => {
      const p = getProfile();
      setCrop(p.cropFocus || "Mixed / General");

      // Generate a mock range based on acres, let's say average yield is 3 tons per acre
      const acres = p.farmSizeAcres || 5;
      const baseYield = 3.2 * acres;
      
      setYieldRange([
        Number((baseYield * 0.85).toFixed(1)),
        Number((baseYield * 1.15).toFixed(1))
      ]);
      setConfidence(82);
      
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        <div className="premium-mesh-glow-1" />
        <div className="premium-mesh-glow-2" />
        
        <main className="app-page-container" style={{ position: "relative", zIndex: 1, paddingTop: 32, paddingBottom: 64 }}>
          
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                Yield Forecast
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <CheckCircle2 size={14} color="var(--accent-primary)" /> Data validated successfully
              </p>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "right" }}>
              Powered by YieldSmart AI<br />
              <span style={{ opacity: 0.7 }}>Last updated: Just now</span>
            </div>
          </div>

          {loading ? (
            <div className="premium-glass-card" style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div className="spinner" style={{ width: 40, height: 40, border: "3px solid rgba(210,245,71,0.2)", borderTopColor: "var(--accent-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Processing Field Data...</div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: 300 }}>Analyzing local soil composition and forecasting 30-day weather patterns.</p>
            </div>
          ) : (
            <div style={{ animation: "fadeIn 0.5s ease-out" }}>
              
              {/* Primary Output Card */}
              <div className="premium-glass-card" style={{ padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden", marginBottom: 24, borderLeft: "4px solid var(--accent-primary)" }}>
                <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.05, transform: "rotate(15deg)" }}>
                  <Sprout size={150} />
                </div>
                
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 600, marginBottom: 8 }}>
                  Estimated {crop} Yield
                </div>
                
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: "clamp(2.5rem, 8vw, 3.5rem)", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--accent-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {yieldRange[0]} - {yieldRange[1]}
                  </span>
                  <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)", fontWeight: 600 }}>Tons</span>
                </div>
                
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: 99, fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 600, border: "1px solid var(--border-subtle)" }}>
                  <Target size={14} color="var(--accent-primary)" /> {confidence}% Confidence Score
                </div>
              </div>

              {/* Prediction Drivers */}
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Prediction Drivers</h3>
              
              <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
                <div className="premium-glass-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(5, 150, 105, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CloudRain size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Optimal Rainfall Expected</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>+12% yield impact based on 30-day forecast.</div>
                  </div>
                </div>

                <div className="premium-glass-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ThermometerSun size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Mild Heat Stress Risk</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>-4% impact during early growth phase.</div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ background: "rgba(239, 68, 68, 0.05)", borderLeft: "3px solid #ef4444", padding: "16px", borderRadius: "0 8px 8px 0", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 32 }}>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>Important Planning Disclaimer</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    These predictions are AI-driven estimates intended for planning purposes only. They are not guaranteed outcomes. Always consult your local agricultural extension office before making critical financial or farming decisions.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <Link href="/dashboard" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "14px", textDecoration: "none" }}>
                  Back to Dashboard
                </Link>
                <Link href="/predict" className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "14px", background: "var(--accent-primary)", color: "var(--bg-primary)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  New Forecast <ArrowRight size={16} />
                </Link>
              </div>

            </div>
          )}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </>
  );
}
