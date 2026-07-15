"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getUser, isAuthenticated } from "@/lib/auth";
import {
  getProfile, saveProfile, FarmerProfile,
  CROP_OPTIONS, SOIL_OPTIONS, CropFocus, SoilType,
} from "@/lib/profile";
import { getLocationWithLabel } from "@/lib/location";
import {
  User, MapPin, Leaf, Settings, LogOut, Sun, Moon,
  CheckCircle2, AlertTriangle, Loader2, Navigation,
  Home, Sprout, ChevronRight,
} from "lucide-react";
import { clearAuth } from "@/lib/auth";

/* ── Small helper components ──────────────────────────────────── */
function SectionCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="app-card" style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
        paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent-primary)",
        }}>
          {icon}
        </div>
        <h2 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: "var(--text-tertiary)", marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: 12, padding: "12px 16px",
  fontSize: "0.875rem", color: "var(--text-primary)",
  outline: "none", transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  fontFamily: "inherit",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  appearance: "none" as const,
  cursor: "pointer",
};

/* ── Main page ──────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; city: string } | null>(null);
  const [profile, setProfileState] = useState<FarmerProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Location state
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/"); return; }
    setUser(getUser() as typeof user);
    setProfileState(getProfile());

    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
  }, [router]);

  const update = useCallback(<K extends keyof FarmerProfile>(key: K, value: FarmerProfile[K]) => {
    setProfileState(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveProfile(next);
      // Show saved indicator briefly
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaved(true);
      saveTimer.current = setTimeout(() => setSaved(false), 2000);
      return next;
    });
  }, []);

  const handleLocationRequest = async () => {
    setLocLoading(true);
    setLocError(null);
    setLocSuccess(null);
    try {
      const loc = await getLocationWithLabel();
      update("savedLat", loc.lat);
      update("savedLon", loc.lon);
      update("locationLabel", loc.displayName);
      update("locationMode", "gps");
      update("locationConfirmed", true);
      setLocSuccess(`📍 ${loc.displayName}`);
    } catch (err) {
      setLocError(err instanceof Error ? err.message : "Could not get location.");
    } finally {
      setLocLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "light") document.body.classList.add("light-theme");
    else document.body.classList.remove("light-theme");
  };

  const handleLogout = () => { clearAuth(); router.push("/"); };

  if (!profile || !user) return null;

  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <Navbar />
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div className="premium-mesh-glow-1" />
        <div className="premium-mesh-glow-2" />
        <main className="app-page-container" style={{ maxWidth: 720, position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-primary)", marginBottom: 8 }}>
            Settings
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, letterSpacing: "-0.035em", fontFamily: "var(--font-display)", marginBottom: 6, color: "var(--text-primary)" }}>
            Farm Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Set your farm details so YieldSmart gives accurate recommendations for your land.
          </p>
        </div>

        {/* ── Saved indicator ── */}
        {saved && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 10, marginBottom: 16,
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
            animation: "fadeIn 0.2s ease",
          }}>
            <CheckCircle2 size={15} color="var(--accent-primary)" />
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-primary)" }}>Changes saved automatically</span>
          </div>
        )}

        {/* ═══════ ACCOUNT INFO ═══════════════════════════════════════ */}
        <SectionCard icon={<User size={16} />} title="Account">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 12, background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-primary), #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "1.1rem", color: "#000", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 2 }}>{user.name}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{user.email}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} /> {user.city}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ═══════ FARM DETAILS ══════════════════════════════════════ */}
        <SectionCard icon={<Home size={16} />} title="Farm Details">
          <Field label="Farm Name" hint="(optional)">
            <input
              type="text"
              placeholder="e.g. Green Valley Farm"
              value={profile.farmName}
              onChange={e => update("farmName", e.target.value)}
              style={INPUT_STYLE}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent-primary)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)"}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Primary Crop">
              <div style={{ position: "relative" }}>
                <select
                  value={profile.cropFocus}
                  onChange={e => update("cropFocus", e.target.value as CropFocus)}
                  style={SELECT_STYLE}
                >
                  {CROP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronRight size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none", color: "var(--text-tertiary)" }} />
              </div>
            </Field>

            <Field label="Soil Type">
              <div style={{ position: "relative" }}>
                <select
                  value={profile.soilType}
                  onChange={e => update("soilType", e.target.value as SoilType)}
                  style={SELECT_STYLE}
                >
                  {SOIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronRight size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none", color: "var(--text-tertiary)" }} />
              </div>
            </Field>
          </div>

          <Field label="Farm Size" hint="(acres, optional)">
            <input
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 5"
              value={profile.farmSizeAcres ?? ""}
              onChange={e => update("farmSizeAcres", e.target.value ? parseFloat(e.target.value) : null)}
              style={{ ...INPUT_STYLE, width: "50%" }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent-primary)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)"}
            />
          </Field>
        </SectionCard>

        {/* ═══════ LOCATION ═════════════════════════════════════════ */}
        <SectionCard icon={<MapPin size={16} />} title="Location">
          <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginBottom: 18, lineHeight: 1.6 }}>
            Your location is used to fetch accurate local weather, soil conditions, and crop recommendations. GPS gives the most precise data for rural farms.
          </p>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {(["gps", "manual"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => update("locationMode", mode)}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 12,
                  border: `1px solid ${profile.locationMode === mode ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  background: profile.locationMode === mode ? "rgba(16,185,129,0.08)" : "var(--bg-tertiary)",
                  color: profile.locationMode === mode ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {mode === "gps" ? <Navigation size={15} /> : <MapPin size={15} />}
                {mode === "gps" ? "GPS / Auto" : "Manual City"}
              </button>
            ))}
          </div>

          {/* GPS mode */}
          {profile.locationMode === "gps" && (
            <div>
              {profile.locationLabel && profile.locationConfirmed && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                  borderRadius: 10, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)",
                  marginBottom: 14,
                }}>
                  <Navigation size={14} color="var(--accent-primary)" />
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-primary)" }}>Current GPS Location</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginTop: 2 }}>{profile.locationLabel}</div>
                    {profile.savedLat && (
                      <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                        {profile.savedLat.toFixed(4)}°N, {profile.savedLon?.toFixed(4)}°E
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleLocationRequest}
                disabled={locLoading}
                style={{
                  width: "100%", padding: "13px 20px", borderRadius: 12,
                  background: locLoading ? "var(--bg-tertiary)" : "var(--accent-primary)",
                  color: locLoading ? "var(--text-tertiary)" : "#000",
                  border: "none", cursor: locLoading ? "not-allowed" : "pointer",
                  fontWeight: 700, fontSize: "0.875rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.15s",
                }}
              >
                {locLoading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Detecting your location…</>
                  : <><Navigation size={16} /> {profile.locationConfirmed ? "Update My Location" : "Use My Current Location"}</>
                }
              </button>

              {locError && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{locError}</span>
                </div>
              )}
              {locSuccess && !locError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
                  <CheckCircle2 size={14} color="var(--accent-primary)" />
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600 }}>{locSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* Manual city mode */}
          {profile.locationMode === "manual" && (
            <div>
              <Field label="City / District">
                <input
                  type="text"
                  placeholder="e.g. Kolkata, Patna, Nagpur"
                  value={profile.locationLabel}
                  onChange={e => {
                    update("locationLabel", e.target.value);
                    update("savedLat", null);
                    update("savedLon", null);
                  }}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent-primary)"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-subtle)"}
                />
              </Field>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", lineHeight: 1.6 }}>
                Type the nearest town/city. If your village is not recognized, use the nearest large town.
              </p>
            </div>
          )}
        </SectionCard>

        {/* ═══════ DISPLAY SETTINGS ══════════════════════════════════ */}
        <SectionCard icon={<Settings size={16} />} title="Display">
          {/* Theme */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>App Theme</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 2 }}>Switch between dark and light mode</div>
            </div>
            <button
              onClick={handleThemeToggle}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 99,
                background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                transition: "all 0.15s",
              }}
            >
              {theme === "dark" ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
            </button>
          </div>
        </SectionCard>

        {/* ═══════ QUICK LINKS ══════════════════════════════════════ */}
        <SectionCard icon={<Leaf size={16} />} title="Quick Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { href: "/dashboard", label: "Go to Dashboard", desc: "Check weather & crop recommendations", color: "#10b981" },
              { href: "/disease",   label: "Scan a Leaf",     desc: "AI disease detection with camera or upload", color: "#60A5FA" },
              { href: "/history",   label: "Scan History",    desc: "Review all your past diagnoses", color: "#A78BFA" },
            ].map((item, i) => (
              <a key={i} href={item.href} style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 4px", borderBottom: "1px solid var(--border-subtle)", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 2 }}>{item.desc}</div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </a>
            ))}
          </div>
        </SectionCard>

        {/* ═══════ DANGER ZONE ═══════════════════════════════════════ */}
        <div className="app-card" style={{ borderColor: "rgba(239,68,68,0.2)", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(239,68,68,0.12)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}>
              <LogOut size={16} />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--danger)", letterSpacing: "-0.01em" }}>Sign Out</h2>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginBottom: 18, lineHeight: 1.6 }}>
            You will be signed out of your account on this device. Your farm profile settings will be saved locally.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: "11px 28px", borderRadius: 99,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              color: "var(--danger)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>

      </main>
    </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: var(--bg-secondary); color: var(--text-primary); }
      `}</style>
    </>
  );
}
