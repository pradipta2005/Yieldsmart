"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiDashboard, DashboardData } from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import {
  Cloud, Droplets, Wind, Eye, Thermometer, Sunrise, Sunset,
  Leaf, AlertTriangle, Droplet, Clock, CheckCircle2, XCircle,
  RefreshCw, ArrowRight, Zap, TrendingUp, Info,
} from "lucide-react";

/* ─── Animated number counter ─────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = to / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 18);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val}{suffix}</>;
}

/* ─── Smooth animated progress bar ────────────────────────── */
function Bar({ value, color, height = 5 }: { value: number; color: string; height?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 500); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ height, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
      <div style={{
        position: "absolute", inset: 0, right: `${100 - w}%`,
        background: color, borderRadius: 99,
        transition: "right 1.2s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: `0 0 8px ${color}60`,
      }} />
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="dashboard-kpi-grid">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 108, borderRadius: 22 }} />)}
      </div>
      <div className="dashboard-main-grid">
        <div className="skeleton" style={{ height: 340, borderRadius: 22 }} />
        <div className="skeleton" style={{ height: 340, borderRadius: 22 }} />
      </div>
      <div className="dashboard-two-col-grid">
        <div className="skeleton" style={{ height: 220, borderRadius: 22 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 22 }} />
      </div>
    </div>
  );
}

const WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const windDir = (deg: number) => WIND_DIRS[Math.round(deg / 45) % 8];

/* ─── Section label ────────────────────────────────────────── */
function Tag({ label, color = "var(--accent-primary)" }: { label: string; color?: string }) {
  return (
    <div style={{
      display: "inline-flex", padding: "3px 10px", borderRadius: 99,
      fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
      background: color + "14", color, border: `1px solid ${color}28`, marginBottom: 10,
    }}>
      {label}
    </div>
  );
}

/* ─── Divider ──────────────────────────────────────────────── */
const Div = () => <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" }} />;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; city: string } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    const u = getUser(); setUser(u);
    const tick = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(tick);
  }, [router]);

  const load = async (city: string) => {
    setLoading(true); setError(null);
    try { setData(await apiDashboard(city)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    load(user.city);
    const ref = setInterval(() => load(user.city), 10 * 60_000);
    return () => clearInterval(ref);
  }, [user]);

  const handleRefresh = async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try { setData(await apiDashboard(user.city)); }
    finally { setRefreshing(false); }
  };

  const hour = time.getHours();
  const greeting = hour < 5 ? "Still up?" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";
  const todayStr = time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const AlertPill = ({ type }: { type: string }) => {
    const c = type === "danger" ? "var(--danger)" : "var(--warning)";
    return (
      <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 99, background: c + "14", color: c, border: `1px solid ${c}28` }}>
        {type}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <main className="app-page-container">

        {/* ══════ PAGE HEADER ══════════════════════════════════════ */}
        {user && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, gap: 16, flexWrap: "wrap" }}>
            <div>
              <Tag label="Farm Intelligence Dashboard" />
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.04em", fontFamily: "var(--font-display)", lineHeight: 1.1, marginBottom: 8 }}>
                {greetEmoji} {greeting},<br />
                <span style={{ color: "var(--accent-primary)" }}>{user.name.split(" ")[0]}.</span>
              </h1>
              <p style={{ color: "var(--text-tertiary)", fontSize: "0.82rem" }}>{todayStr}</p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              {data && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                  borderRadius: 99, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                }}>
                  <Leaf size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Season</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "capitalize", color: "var(--text-primary)" }}>{data.season}</span>
                </div>
              )}
              <button onClick={handleRefresh} disabled={refreshing} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 99,
                background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        )}

        {/* ══════ ERROR ════════════════════════════════════════════ */}
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderRadius: 16, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: 24 }}>
            <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.875rem" }}>Could not load dashboard</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: 3 }}>{error}</div>
            </div>
          </div>
        )}

        {loading && <Skeleton />}

        {!loading && data && (() => {
          const sev = (n: number) => n > 80 ? "var(--success)" : n > 50 ? "var(--warning)" : "var(--danger)";

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ══ ROW 0 — KPI STRIP ══════════════════════════════════ */}
              <div className="dashboard-kpi-grid">
                {[
                  { emoji: "🌡️", label: "Temperature", value: data.weather.temp, suffix: "°C", sub: data.weather.description, color: "#60A5FA" },
                  { emoji: "💧", label: "Humidity", value: data.weather.humidity, suffix: "%", sub: "Relative humidity", color: "#34D399" },
                  { emoji: "💨", label: "Wind Speed", value: data.weather.wind_speed, suffix: " km/h", sub: windDir(data.weather.wind_deg), color: "#A78BFA" },
                  { emoji: "🌱", label: "Soil Moisture", value: data.soil.moisture_pct, suffix: "%", sub: data.soil.moisture_level, color: "#FBBF24" },
                ].map((kpi, i) => (
                  <div key={i} className="kpi-card">
                    {/* Subtle corner glow */}
                    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle at top right, ${kpi.color}14, transparent 70%)`, pointerEvents: "none" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                      <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{kpi.emoji}</span>
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)" }}>{kpi.label}</span>
                    </div>
                    <div style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.04em", fontFamily: "var(--font-display)", color: kpi.color, lineHeight: 1, marginBottom: 8 }}>
                      <CountUp to={kpi.value} suffix={kpi.suffix} />
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "capitalize", fontWeight: 500 }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* ══ ROW 1 — WEATHER + SOIL ═════════════════════════════ */}
              <div className="dashboard-main-grid">

                {/* ── Weather ─── */}
                <div className="app-card">
                  {/* Decorative circle */}
                  <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                    <div>
                      <Tag label="Live Weather" color="#60A5FA" />
                      <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{data.weather.city}, {data.weather.country}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-primary)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                      Live
                    </div>
                  </div>

                  {/* Main temp display */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginBottom: 32, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                        {data.weather.temp}
                        <span style={{ fontSize: "2.5rem", color: "var(--text-tertiary)", fontWeight: 400 }}>°C</span>
                      </div>
                      <div style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginTop: 10, textTransform: "capitalize", fontWeight: 500 }}>{data.weather.description}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginTop: 5 }}>
                        High {data.weather.temp_max}° · Low {data.weather.temp_min}°
                      </div>
                    </div>
                    <div style={{ fontSize: "6rem", lineHeight: 1, marginBottom: 8, filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}>
                      {data.weather.icon_emoji}
                    </div>
                  </div>

                  <Div />

                  {/* Detail grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
                    {[
                      { icon: <Droplets size={14} />, lbl: "Humidity", val: `${data.weather.humidity}%`, color: "#34D399" },
                      { icon: <Wind size={14} />, lbl: "Wind", val: `${data.weather.wind_speed} km/h ${windDir(data.weather.wind_deg)}`, color: "#A78BFA" },
                      { icon: <Eye size={14} />, lbl: "Visibility", val: `${data.weather.visibility} km`, color: "#60A5FA" },
                      { icon: <Thermometer size={14} />, lbl: "Pressure", val: `${data.weather.pressure} hPa`, color: "#FB923C" },
                      { icon: <Sunrise size={14} />, lbl: "Sunrise", val: data.weather.sunrise, color: "#FBBF24" },
                      { icon: <Sunset size={14} />, lbl: "Sunset", val: data.weather.sunset, color: "#F472B6" },
                    ].map(m => (
                      <div key={m.lbl} style={{ padding: "14px", background: "var(--bg-tertiary)", borderRadius: 14, border: "1px solid var(--border-subtle)", transition: "background 0.2s" }}>
                        <div style={{ color: m.color, marginBottom: 8, opacity: 0.8 }}>{m.icon}</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{m.val}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{m.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Soil Intelligence ─── */}
                <div className="app-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

                  <Tag label="Soil Intelligence" color="var(--accent-primary)" />
                  <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", marginBottom: 4, color: "var(--text-primary)" }}>Soil Metrics</div>
                  <p style={{ color: "var(--text-tertiary)", fontSize: "0.76rem", marginBottom: 24, lineHeight: 1.5 }}>
                    Inferred from real-time weather and regional field models.
                  </p>

                  {/* Moisture */}
                  {[
                    {
                      label: "Moisture", value: `${data.soil.moisture_pct}%`, pct: data.soil.moisture_pct,
                      color: data.soil.moisture_color === "green" ? "var(--success)" : data.soil.moisture_color === "amber" ? "var(--warning)" : "var(--info)",
                      badge: data.soil.moisture_level,
                    },
                    { label: "Nitrogen", value: data.soil.nitrogen, pct: data.soil.nitrogen_pct, color: "#60A5FA" },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>{s.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>{s.value}</span>
                          {s.badge && (
                            <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 99, background: s.color + "18", color: s.color, border: `1px solid ${s.color}30` }}>
                              {s.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <Bar value={s.pct} color={s.color} height={5} />
                    </div>
                  ))}

                  <Div />

                  {/* Soil parameters */}
                  {[
                    { label: "Soil Temperature", value: `${data.soil.soil_temp}°C`, icon: "🌡️" },
                    { label: "pH Level", value: data.soil.ph_label, icon: "⚗️" },
                  ].map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 7 }}>
                        <span>{m.icon}</span> {m.label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{m.value}</span>
                    </div>
                  ))}

                  <div style={{ padding: "12px 14px", background: "var(--success-bg)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.1)", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, display: "flex", gap: 8, alignItems: "flex-start", marginTop: "auto" }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 2, color: "var(--accent-primary)", opacity: 0.6 }} />
                    {data.soil.note}
                  </div>
                </div>
              </div>

              {/* ══ ROW 2 — ALERTS + IRRIGATION ════════════════════════ */}
              <div className="dashboard-two-col-grid">

                {/* ── Alerts ─── */}
                <div className="app-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <div>
                      <Tag label="Farm Alerts" color={data.alerts.some(a => a.type === "danger") ? "var(--danger)" : data.alerts.some(a => a.type === "warning") ? "var(--warning)" : "var(--success)"} />
                      <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Active Alerts</div>
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "var(--font-display)", color: data.alerts.length === 0 ? "var(--success)" : "var(--warning)" }}>
                      {data.alerts.length}
                    </div>
                  </div>

                  {data.alerts.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {data.alerts.map((a, i) => {
                        const c = a.type === "danger" ? "var(--danger)" : "var(--warning)";
                        return (
                          <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14, background: c + "08", border: `1px solid ${c}20` }}>
                            <span style={{ fontSize: "1.4rem", flexShrink: 0, lineHeight: 1 }}>{a.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{a.title}</span>
                                <AlertPill type={a.type} />
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{a.message}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 14, textAlign: "center" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={24} color="var(--success)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>All clear</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", lineHeight: 1.55 }}>Your farm has no active alerts right now.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Irrigation ─── */}
                <div className="app-card">
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

                  <Tag label="Water Management" color="#60A5FA" />
                  <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", marginBottom: 22, color: "var(--text-primary)" }}>Irrigation Schedule</div>

                  {[
                    { icon: <Sunrise size={16} color="#FBBF24" />, label: "Morning Window", value: data.irrigation.morning, note: "Ideal pre-evaporation window" },
                    { icon: <Sunset size={16} color="#F472B6" />, label: "Evening Window", value: data.irrigation.evening, note: "Cooler, lower wind conditions" },
                    { icon: <Clock size={16} color="#60A5FA" />, label: "Frequency", value: data.irrigation.frequency, note: "Recommended cycle" },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: "16px", background: "var(--bg-tertiary)", borderRadius: 14, border: "1px solid var(--border-subtle)", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {m.icon} {m.label}
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>{m.value}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginLeft: 24 }}>{m.note}</div>
                    </div>
                  ))}

                  <div style={{ marginTop: 6, padding: "12px 14px", background: "var(--info-bg)", borderRadius: 12, border: "1px solid rgba(59,130,246,0.12)", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Droplet size={13} style={{ flexShrink: 0, marginTop: 2, color: "#60A5FA", opacity: 0.7 }} />
                    {data.irrigation.reason}
                  </div>
                </div>
              </div>

              {/* ══ ROW 3 — CROPS ════════════════════════════════════════ */}
              <div className="app-card">
                <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 500, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                  <div>
                    <Tag label="AI Recommendations" />
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "var(--font-display)", marginBottom: 4, color: "var(--text-primary)" }}>
                      Optimal Crops
                    </h2>
                    <p style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>Matched to current climate, season, and soil conditions.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Zap size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)" }}>
                      {data.crops.length} crop{data.crops.length !== 1 ? "s" : ""} matched
                    </span>
                  </div>
                </div>

                {data.crops.length > 0 ? (
                  <div className="dashboard-crop-grid">
                    {data.crops.map((c, i) => (
                      <div
                        key={c.name}
                        className="crop-recommendation-card"
                        style={{
                          padding: "22px", borderRadius: 18,
                          border: "1px solid var(--border-subtle)",
                          background: "var(--bg-tertiary)",
                          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.25s, box-shadow 0.25s",
                          cursor: "default",
                          position: "relative", overflow: "hidden",
                        }}
                        onMouseOver={e => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.3)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(16,185,129,0.07)";
                        }}
                        onMouseOut={e => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        {/* Match rank badge for top crop */}
                        {i === 0 && (
                          <div style={{ position: "absolute", top: 14, right: 14, fontSize: "0.55rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 8px", borderRadius: 99, background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)" }}>
                            Top Pick
                          </div>
                        )}

                        <div style={{ fontSize: "2.5rem", lineHeight: 1, marginBottom: 16 }}>{c.emoji}</div>

                        <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", marginBottom: 4, color: "var(--text-primary)" }}>{c.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: 16, fontWeight: 500 }}>{c.soil_type}</div>

                        {/* Score bar */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Match</span>
                            <span style={{ fontWeight: 900, fontSize: "0.95rem", color: sev(c.score), fontFamily: "var(--font-display)" }}>{c.score}%</span>
                          </div>
                          <Bar value={c.score} color={sev(c.score)} height={4} />
                        </div>

                        <Div />
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.tip}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", gap: 14, textAlign: "center" }}>
                    <XCircle size={38} color="rgba(255,255,255,0.12)" />
                    <div style={{ fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>No matches found</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", maxWidth: 320, lineHeight: 1.6 }}>
                      Current conditions don&apos;t strongly match standard crop profiles. Consult a local agronomist for advice.
                    </div>
                  </div>
                )}
              </div>

              {/* ══ ROW 4 — QUICK ACTIONS STRIP ════════════════════════ */}
              <div className="dashboard-two-col-grid">
                {[
                  { href: "/disease", icon: <TrendingUp size={18} />, title: "Scan a Leaf", desc: "Upload a photo and get an instant disease diagnosis with treatment plan.", color: "var(--accent-primary)" },
                  { href: "/history", icon: <ArrowRight size={18} />, title: "View Scan History", desc: "Review past diagnoses and track your crop health over time.", color: "#60A5FA" },
                ].map((action, i) => (
                  <a key={i} href={action.href} className="app-card" style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, textDecoration: "none", transition: "transform 0.25s, border-color 0.25s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = action.color + "35"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: action.color + "14", border: `1px solid ${action.color}28`, display: "flex", alignItems: "center", justifyContent: "center", color: action.color, flexShrink: 0 }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 4, color: "var(--text-primary)" }}>{action.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{action.desc}</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-tertiary)" style={{ opacity: 0.5 }} />
                  </a>
                ))}
              </div>

            </div>
          );
        })()}

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
