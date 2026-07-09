"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiSignIn, apiSignUp } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { Leaf, Mail, Lock, User, MapPin, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

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

  return (
    <div className="auth-container">
      <Link href="/" style={{ position: 'absolute', top: 32, left: 32, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Leaf size={24} color="var(--accent-primary)" />
        <span style={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          YieldSmart
        </span>
      </Link>

      <div className="auth-box">
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{isSignIn ? "Welcome back" : "Create an account"}</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {isSignIn ? "Enter your details to access your dashboard." : "Start managing your farm intelligently."}
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
                    className="input input-with-icon" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="input-label">City / Location</label>
                <div className="input-wrap">
                  <span className="input-icon-left"><MapPin size={16} /></span>
                  <input 
                    type="text" 
                    className="input input-with-icon" 
                    placeholder="New Delhi" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                  />
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
                className="input input-with-icon" 
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
                className="input input-with-icon" 
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
            style={{ width: '100%', marginTop: 8, padding: '10px' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : (isSignIn ? "Sign In" : "Create Account")}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
