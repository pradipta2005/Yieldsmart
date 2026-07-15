"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiSignIn, apiSignUp } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { Leaf, Mail, Lock, User, MapPin, ArrowRight, AlertCircle, Loader2, Navigation } from "lucide-react";
import { getLocationWithLabel } from "@/lib/location";
import { saveProfile } from "@/lib/profile";

export default function AuthPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = use(searchParams);
  const router = useRouter();
  const initTab = resolvedParams.tab === "signup" ? "signup" : "signin";
  const [isSignIn, setIsSignIn] = useState(initTab === "signin");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    document.body.classList.remove("light-theme");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isSignIn) {
        const res = await apiSignIn({ email, password });
        saveAuth(res.token, res.user);
        router.push("/dashboard");
      } else {
        const res = await apiSignUp({ email, password, name, city });
        saveAuth(res.token, res.user);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLocateMe = async () => {
    setIsLocating(true);
    setError(null);
    try {
      const loc = await getLocationWithLabel();
      setCity(loc.displayName);
      saveProfile({
        locationMode: "gps",
        savedLat: loc.lat,
        savedLon: loc.lon,
        locationLabel: loc.displayName,
        locationConfirmed: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to get location");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="auth-container">
      {/* ── Left Illustration Sidebar (Hidden on Mobile) ── */}
      <div className="auth-sidebar">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-logo-container">
            <Leaf size={16} color="var(--accent-primary)" />
          </div>
          <span className="brand-text">YieldSmart</span>
        </Link>

        <div style={{ paddingRight: 40, marginTop: "auto", marginBottom: "auto" }}>
          <div className="premium-pill-badge" style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", border: "1px solid rgba(210,245,71,0.18)", marginBottom: 20 }}>
            🌾 Smart Agriculture
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.04em", fontFamily: "var(--font-display)", lineHeight: 1.15, marginBottom: 20 }}>
            Precision field analytics.<br />
            Optimal <span style={{ color: "var(--accent-primary)" }}>crop yields</span>.
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 400 }}>
            Every seed deserves precision weather, water, and soil diagnostics. Welcome to the next level of smart farming.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
          <span>© 2026 YieldSmart Inc.</span>
          <span>Farmer-First Platform</span>
        </div>
      </div>

      {/* ── Right Form Pane ── */}
      <div className="auth-form-pane">
        <div className="premium-mesh-glow-1" style={{ opacity: 0.5 }} />
        <div className="premium-mesh-glow-2" style={{ opacity: 0.5 }} />

        {/* Small floating logo for mobile layout */}
        <Link href="/" style={{ position: "absolute", top: 24, left: 24, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-only-logo">
          <Leaf size={20} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            YieldSmart
          </span>
        </Link>

        <div className="auth-box">
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 8 }}>
              {isSignIn ? "Welcome back" : "Create account"}
            </h1>
            <p style={{ fontSize: '0.82rem', color: "var(--text-secondary)" }}>
              {isSignIn ? "Enter your credentials to access your dashboard" : "Start managing your farm intelligently"}
            </p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isSignIn ? 'active' : ''}`} 
              onClick={() => { setIsSignIn(true); setError(null); }}
              style={{ flex: 1 }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${!isSignIn ? 'active' : ''}`} 
              onClick={() => { setIsSignIn(false); setError(null); }}
              style={{ flex: 1 }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 24, padding: '12px' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.8125rem' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isSignIn && (
              <>
                <div>
                  <label className="input-label">Full Name</label>
                  <div className="input-wrap">
                    <span className="input-icon-left"><User size={16} /></span>
                    <input 
                      type="text" 
                      className="input input-with-icon premium-input" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">City / Location</label>
                  <div className="input-wrap" style={{ position: "relative" }}>
                    <span className="input-icon-left"><MapPin size={16} /></span>
                    <input 
                      type="text" 
                      className="input input-with-icon premium-input" 
                      placeholder="New Delhi" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                      required 
                      style={{ paddingRight: "48px" }}
                    />
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent-primary)",
                        cursor: isLocating ? "not-allowed" : "pointer",
                      }}
                      title="Use my current location"
                    >
                      {isLocating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="input-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon-left"><Mail size={16} /></span>
                <input 
                  type="email" 
                  className="input input-with-icon premium-input" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon-left"><Lock size={16} /></span>
                <input 
                  type="password" 
                  className="input input-with-icon premium-input" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 8, padding: '12px', borderRadius: 99, background: "var(--accent-primary)", color: "var(--bg-primary)", fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : (isSignIn ? "Sign In" : "Create Account")}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
