"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiDashboard, DashboardData } from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import {
  Cloud, Droplets, Wind, Eye, Thermometer, Sunrise, Sunset,
  Leaf, AlertTriangle, Droplet, Clock, CheckCircle2, XCircle,
  RefreshCw, ArrowRight, Zap, TrendingUp, Info,
  Sun, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, CloudRain,
  Navigation, MapPin
} from "lucide-react";

/* ─── Animated number counter ─────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 250; // Snappy 250ms total animation duration
    const steps = 12;
    const step = to / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, interval);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val}{suffix}</>;
}

/* ─── Smooth animated progress bar ────────────────────────── */
function Bar({ value, color, height = 5 }: { value: number; color: string; height?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 100); return () => clearTimeout(t); }, [value]);
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

function isFocusMatch(cropName: string, focus: string): boolean {
  if (!focus || focus === "Mixed / General") return false;
  const c = cropName.toLowerCase();
  const f = focus.toLowerCase();

  if (f.includes("rice") || f.includes("paddy")) return c.includes("rice") || c.includes("paddy");
  if (f.includes("wheat")) return c.includes("wheat");
  if (f.includes("maize") || f.includes("corn")) return c.includes("maize") || c.includes("corn");
  if (f.includes("cotton")) return c.includes("cotton");
  if (f.includes("sugarcane")) return c.includes("sugarcane");
  if (f.includes("vegetables")) {
    const veggies = ["tomato", "potato", "chili", "brinjal", "okra", "onion", "cabbage", "cauliflower", "spinach", "carrot", "radish", "pea", "cucumber", "beans"];
    return veggies.some(v => c.includes(v)) || c.includes("vegetable");
  }
  if (f.includes("fruits")) {
    const fruits = ["apple", "mango", "banana", "orange", "guava", "papaya", "pomegranate", "grape", "lemon", "lime"];
    return fruits.some(fr => c.includes(fr)) || c.includes("fruit");
  }
  if (f.includes("pulses") || f.includes("lentils")) {
    const pulses = ["lentil", "gram", "pea", "bean", "pigeonpea", "cowpea", "moong", "urad"];
    return pulses.some(p => c.includes(p)) || c.includes("pulse") || c.includes("legume");
  }
  if (f.includes("oilseeds")) {
    const oil = ["mustard", "groundnut", "soybean", "sunflower", "sesame", "linseed", "castor"];
    return oil.some(o => c.includes(o)) || c.includes("oilseed");
  }
  return false;
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

/* ─── Weather Icon Helper ─────────────────────────────────── */
function getWeatherIcon(desc: string, size: number = 24) {
  const d = desc.toLowerCase();
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return <CloudRain size={size} style={{ strokeWidth: 1.25 }} />;
  if (d.includes("thunderstorm") || d.includes("storm")) return <CloudLightning size={size} style={{ strokeWidth: 1.25 }} />;
  if (d.includes("snow") || d.includes("ice") || d.includes("freeze")) return <CloudSnow size={size} style={{ strokeWidth: 1.25 }} />;
  if (d.includes("clear") || d.includes("sunny") || d.includes("sun")) return <Sun size={size} style={{ strokeWidth: 1.25 }} />;
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return <CloudFog size={size} style={{ strokeWidth: 1.25 }} />;
  return <Cloud size={size} style={{ strokeWidth: 1.25 }} />;
}


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; city: string } | null>(null);
  const [farmName, setFarmName] = useState("");
  const [cropFocus, setCropFocus] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [isGPS, setIsGPS] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    const u = getUser();
    setUser(u);
    const p = getProfile();
    setFarmName(p.farmName || "");
    setCropFocus(p.cropFocus || "");
    if (p.locationLabel) {
      setLocationLabel(p.locationLabel);
      setIsGPS(p.locationMode === "gps");
    } else if (u?.city) {
      setLocationLabel(u.city);
      setIsGPS(false);
    }
    const tick = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(tick);
  }, [router]);

  const load = async (city: string, lat?: number | null, lon?: number | null) => {
    setLoading(true); setError(null);
    try { setData(await apiDashboard(city, lat, lon)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    const p = getProfile();
    // For GPS mode, use user.city (valid city) as backend fallback to avoid OWM lookup errors
    // For manual mode, use the farmer's typed location
    const city = (p.locationMode === "manual" && p.locationLabel)
      ? p.locationLabel.split(",")[0].trim()
      : user.city;
    const lat = (p.locationMode === "gps" && p.savedLat) ? p.savedLat : null;
    const lon = (p.locationMode === "gps" && p.savedLon) ? p.savedLon : null;
    load(city, lat, lon);
    const ref = setInterval(() => load(city, lat, lon), 10 * 60_000);
    return () => clearInterval(ref);
  }, [user]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const p = getProfile();
    const city = (p.locationMode === "manual" && p.locationLabel)
      ? p.locationLabel.split(",")[0].trim()
      : (user?.city || "");
    const lat = (p.locationMode === "gps" && p.savedLat) ? p.savedLat : null;
    const lon = (p.locationMode === "gps" && p.savedLon) ? p.savedLon : null;
    try { setData(await apiDashboard(city, lat, lon)); }
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
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div className="premium-mesh-glow-1" />
        <div className="premium-mesh-glow-2" />
        <main className="app-page-container" style={{ position: "relative", zIndex: 1 }}>

        {/* ══════ PAGE HEADER ══════════════════════════════════════ */}
        {user && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, gap: 16, flexWrap: "wrap" }}>
            <div>
              <Tag label="Farm Intelligence Dashboard" />
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.04em", fontFamily: "var(--font-display)", lineHeight: 1.1, marginBottom: 8 }}>
                {greetEmoji} {greeting},<br />
                <span style={{ color: "var(--accent-primary)" }}>
                  {farmName ? farmName : user.name.split(" ")[0]}.
                </span>
              </h1>
              {/* Location indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {isGPS
                  ? <Navigation size={11} color="var(--accent-primary)" />
                  : <MapPin size={11} color="var(--text-tertiary)" />}
                <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>{locationLabel}</span>
                <a href="/profile" style={{ fontSize: "0.72rem", color: "var(--accent-primary)", textDecoration: "none", marginLeft: 4, opacity: 0.8 }}>change</a>
              </div>
              <p style={{ color: "var(--text-tertiary)", fontSize: "0.82rem", marginTop: 4 }}>{todayStr}</p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
              {cropFocus && cropFocus !== "Mixed / General" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                  borderRadius: 99, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)",
                  fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-primary)",
                  letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                  <Leaf size={11} /> {cropFocus}
                </div>
              )}
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
                  { icon: <Thermometer size={14} />, label: "Temperature", value: data.weather.temp, suffix: "°C", sub: data.weather.description, color: "#60A5FA" },
                  { icon: <Droplets size={14} />, label: "Humidity", value: data.weather.humidity, suffix: "%", sub: "Relative humidity", color: "#34D399" },
                  { icon: <Wind size={14} />, label: "Wind Speed", value: data.weather.wind_speed, suffix: " km/h", sub: windDir(data.weather.wind_deg), color: "#A78BFA" },
                  { icon: <Droplet size={14} />, label: "Soil Moisture", value: data.soil.moisture_pct, suffix: "%", sub: data.soil.moisture_level, color: "#FBBF24" },
                ].map((kpi, i) => {
                  const accentClass = i === 0 ? "app-card-accent-blue" : i === 1 ? "app-card-accent-emerald" : i === 2 ? "app-card-accent-blue" : "app-card-accent-yellow";
                  return (
                    <div key={i} className={`kpi-card premium-glass-card ${accentClass}`} style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>{kpi.label}</span>
                        <div style={{ color: kpi.color, display: "flex", alignItems: "center", opacity: 0.8 }}>{kpi.icon}</div>
                      </div>
                      <div className="premium-metric-value" style={{ lineHeight: 1, marginBottom: 8 }}>
                        <CountUp to={kpi.value} suffix={kpi.suffix} />
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "capitalize", fontWeight: 500 }}>{kpi.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* ══ ROW 1 — WEATHER + SOIL ═════════════════════════════ */}
              <div className="dashboard-main-grid">

                {/* ── Weather ─── */}
                <div className="app-card premium-glass-card app-card-accent-blue">
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, marginBottom: 32, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "clamp(3rem, 8vw, 4.75rem)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                        {data.weather.temp}
                        <span style={{ fontSize: "2rem", color: "var(--text-tertiary)", fontWeight: 400 }}>°C</span>
                      </div>
                      <div style={{ fontSize: "1.1rem", fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-secondary)", marginTop: 10, textTransform: "capitalize", fontWeight: 400 }}>
                        {data.weather.description}
                      </div>
                      <div style={{ fontSize: "0.82rem", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginTop: 6 }}>
                        High {data.weather.temp_max}° · Low {data.weather.temp_min}°
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: "50%", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", color: "#60A5FA" }}>
                      {getWeatherIcon(data.weather.description, 40)}
                    </div>
                  </div>

                  <Div />

                  {/* Detail grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
                    {[
                      { icon: <Droplets size={13} />, lbl: "Humidity", val: `${data.weather.humidity}%`, color: "#34D399" },
                      { icon: <Wind size={13} />, lbl: "Wind Speed", val: `${data.weather.wind_speed} km/h`, color: "#A78BFA" },
                      { icon: <Eye size={13} />, lbl: "Visibility", val: `${data.weather.visibility} km`, color: "#60A5FA" },
                      { icon: <Thermometer size={13} />, lbl: "Pressure", val: `${data.weather.pressure} hPa`, color: "#FB923C" },
                      { icon: <Sunrise size={13} />, lbl: "Sunrise", val: data.weather.sunrise, color: "#FBBF24" },
                      { icon: <Sunset size={13} />, lbl: "Sunset", val: data.weather.sunset, color: "#F472B6" },
                    ].map(m => (
                      <div key={m.lbl} style={{ padding: "8px 0 8px 12px", borderLeft: `1px solid ${m.color}50` }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 3 }}>{m.lbl}</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Soil Intelligence ─── */}
                <div className="app-card premium-glass-card app-card-accent-emerald" style={{ display: "flex", flexDirection: "column" }}>
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
                    <div key={s.label} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: "0.875rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{s.value}</span>
                          {s.badge && (
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, background: s.color + "12", color: s.color, border: `1px solid ${s.color}25` }}>
                              {s.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <Bar value={s.pct} color={s.color} height={2} />
                    </div>
                  ))}

                  <Div />

                  {/* Soil parameters */}
                  {[
                    { label: "Soil Temperature", value: `${data.soil.soil_temp}°C`, icon: <Thermometer size={12} /> },
                    { label: "pH Level", value: data.soil.ph_label, icon: <Info size={12} /> },
                  ].map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ opacity: 0.6 }}>{m.icon}</span> {m.label}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{m.value}</span>
                    </div>
                  ))}

                  <div style={{ padding: "10px 12px 10px 14px", borderLeft: "2px solid var(--accent-primary)", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, display: "flex", gap: 8, alignItems: "flex-start", marginTop: "auto" }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 2, color: "var(--accent-primary)", opacity: 0.8 }} />
                    <p style={{ fontStyle: "italic", fontFamily: "var(--font-sans)" }}>{data.soil.note}</p>
                  </div>
                </div>
              </div>

              {/* ══ ROW 2 — ALERTS + IRRIGATION ════════════════════════ */}
              <div className="dashboard-two-col-grid">

                {/* ── Alerts ─── */}
                <div className={`app-card premium-glass-card ${data.alerts.some(a => a.type === "danger") ? "app-card-accent-red" : data.alerts.length > 0 ? "app-card-accent-yellow" : "app-card-accent-emerald"}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <div>
                      <Tag label="Farm Alerts" color={data.alerts.some(a => a.type === "danger") ? "var(--danger)" : data.alerts.some(a => a.type === "warning") ? "var(--warning)" : "var(--success)"} />
                      <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Active Alerts</div>
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 600, fontFamily: "var(--font-mono)", color: data.alerts.length === 0 ? "var(--success)" : "var(--warning)" }}>
                      {data.alerts.length.toString().padStart(2, "0")}
                    </div>
                  </div>

                  {data.alerts.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {data.alerts.map((a, i) => {
                        const c = a.type === "danger" ? "var(--danger)" : "var(--warning)";
                        return (
                          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 12, background: "transparent", borderLeft: `2px solid ${c}`, borderTop: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{a.title}</span>
                                <AlertPill type={a.type} />
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{a.message}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 14, textAlign: "center" }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={22} color="var(--success)" style={{ strokeWidth: 1.5 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>All clear</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>Your farm has no active alerts right now.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Irrigation ─── */}
                <div className="app-card premium-glass-card app-card-accent-blue">
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

                  <Tag label="Water Management" color="#60A5FA" />
                  <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", marginBottom: 22, color: "var(--text-primary)" }}>Irrigation Schedule</div>

                  {[
                    { icon: <Sunrise size={14} color="#FBBF24" />, label: "Morning Window", value: data.irrigation.morning, note: "Ideal pre-evaporation window" },
                    { icon: <Sunset size={14} color="#F472B6" />, label: "Evening Window", value: data.irrigation.evening, note: "Cooler, lower wind conditions" },
                    { icon: <Clock size={14} color="#60A5FA" />, label: "Frequency", value: data.irrigation.frequency, note: "Recommended cycle" },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: "12px 14px", background: "transparent", borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {m.icon} {m.label}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{m.value}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginLeft: 22 }}>{m.note}</div>
                    </div>
                  ))}

                  <div style={{ marginTop: 14, padding: "10px 12px 10px 14px", borderLeft: "2px solid #60A5FA", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Droplet size={13} style={{ flexShrink: 0, marginTop: 2, color: "#60A5FA", opacity: 0.8 }} />
                    <p style={{ fontStyle: "italic" }}>{data.irrigation.reason}</p>
                  </div>
                </div>
              </div>

              {/* ══ ROW 3 — CROPS ════════════════════════════════════════ */}
              <div className="app-card premium-glass-card app-card-accent-emerald">
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
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                      {data.crops.length.toString().padStart(2, "0")} MATCHED
                    </span>
                  </div>
                </div>

                {data.crops.length > 0 ? (
                  <div className="dashboard-crop-grid">
                    {(() => {
                      const sorted = [...data.crops].sort((a, b) => {
                        const aMatch = isFocusMatch(a.name, cropFocus);
                        const bMatch = isFocusMatch(b.name, cropFocus);
                        if (aMatch && !bMatch) return -1;
                        if (!aMatch && bMatch) return 1;
                        return b.score - a.score;
                      });
                      return sorted.map((c, i) => {
                        const matched = isFocusMatch(c.name, cropFocus);
                        return (
                          <div
                            key={c.name}
                            className="crop-recommendation-card"
                            style={{
                              padding: "24px", borderRadius: 16,
                              border: "1px solid var(--border-subtle)",
                              background: "var(--bg-secondary)",
                              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.25s, box-shadow 0.25s",
                              cursor: "default",
                              position: "relative", overflow: "hidden",
                            }}
                            onMouseOver={e => {
                              (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                              (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.35)";
                              (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 30px rgba(0,0,0,0.4)";
                            }}
                            onMouseOut={e => {
                              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                              (e.currentTarget as HTMLElement).style.boxShadow = "none";
                            }}
                          >
                            {/* Match rank badge */}
                            {matched ? (
                              <div style={{ position: "absolute", top: 16, right: 16, fontSize: "0.55rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.08)", color: "var(--accent-primary)", border: "1px solid rgba(16,185,129,0.2)" }}>
                                Focus Match
                              </div>
                            ) : i === 0 ? (
                              <div style={{ position: "absolute", top: 16, right: 16, fontSize: "0.55rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 4, background: "rgba(212,175,55,0.08)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>
                                Top Pick
                              </div>
                            ) : null}

                            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
                              <div style={{
                                width: 44, height: 44, borderRadius: "50%",
                                background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.5rem", lineHeight: 1
                              }}>
                                {c.emoji}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{c.name}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 1 }}>{c.soil_type}</div>
                              </div>
                            </div>

                            {/* Monospace Tech Match indicator */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-tertiary)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", marginBottom: 18 }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>MATCH INDEX</span>
                              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: sev(c.score), fontFamily: "var(--font-mono)" }}>//{c.score}.00%</span>
                            </div>

                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;{c.tip}&rdquo;</div>
                          </div>
                        );
                      });
                    })()}
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
    </div>

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
