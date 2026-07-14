"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { isAuthenticated } from "@/lib/auth";
import { ArrowRight, Leaf, ShieldCheck, BarChart3, CloudRain, ChevronDown, Sparkles } from "lucide-react";

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Scroll effect for navbar ── */
  useEffect(() => {
    setIsAuth(isAuthenticated());
    document.body.classList.remove("light-theme");
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Scroll-reveal observer — replays every time element enters viewport ── */
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".reveal");
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            // Animate IN
            el.style.opacity = "1";
            el.style.transform = "translateY(0) scale(1)";
          } else {
            // Reset OUT — so it re-animates next time
            el.style.opacity = "0";
            el.style.transform = "translateY(48px) scale(0.98)";
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <CloudRain size={26} color="#60A5FA" />,
      color: "#60A5FA",
      bg: "rgba(96,165,250,0.08)",
      border: "rgba(96,165,250,0.15)",
      title: "Weather at a Glance",
      desc: "Forecasts pulled from your field's exact coordinates — not a nearby city. Plan irrigation, harvesting, and spraying around what's actually coming.",
      stat: "5-Day",
      statLabel: "Forecast Depth",
      tag: "Live Data",
    },
    {
      icon: <ShieldCheck size={26} color="#34D399" />,
      color: "#34D399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.15)",
      title: "Snap. Scan. Treat.",
      desc: "Point your phone at a troubled leaf. Our model names the disease in under two seconds and hands you a treatment plan — organic options included.",
      stat: "48+",
      statLabel: "Diseases Covered",
      tag: "AI Powered",
    },
    {
      icon: <BarChart3 size={26} color="#FBBF24" />,
      color: "#FBBF24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.15)",
      title: "Know Your Soil",
      desc: "Moisture, nitrogen, pH, and temperature — inferred from climate models and regional data. No sensors, no lab kit, no extra hardware.",
      stat: "6",
      statLabel: "Soil Parameters",
      tag: "Smart Inference",
    },
  ];

  const innovators = [
    {
      name: "Aryan Srivastava",
      initials: "AS",
      role: "AI & Model Architecture",
      desc: "Built and trained the convolutional neural network powering the disease classifier.",
      color: "#34D399",
    },
    {
      name: "Pradipta Khan",
      initials: "PK",
      role: "Backend & Data Systems",
      desc: "Engineered the API layer, authentication flow, and scan history persistence.",
      color: "#60A5FA",
    },
    {
      name: "Rahul Mondal",
      initials: "RM",
      role: "Interface & Experience",
      desc: "Designed the visual identity, interaction patterns, and responsive layouts.",
      color: "#A78BFA",
    },
    {
      name: "Souvik Gosh",
      initials: "SG",
      role: "Agronomy & Research",
      desc: "Translated agricultural science into the crop recommendation and alerting logic.",
      color: "#FBBF24",
    },
  ];

  const revealStyle = (delay = 0): React.CSSProperties => ({
    opacity: 0,
    transform: "translateY(48px) scale(0.98)",
    transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <div style={{ position: "relative", background: "var(--bg-primary)" }}>

      {/* ═══ PREMIUM FIXED NAVBAR ════════════════════════════════════════ */}
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-brand anim-slide-left delay-200">
          <div style={{
            width: 34, height: 34, borderRadius: "var(--radius-md)",
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={18} color="var(--accent-primary)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.03em", color: "#FFF" }}>
            YieldSmart
          </span>
        </div>

        <div className="nav-center anim-fade-in delay-400">
          <Link href="#hero">Home</Link>
          <Link href="#features">Features</Link>
          <Link href="#team">Team</Link>
          {isAuth && <Link href="/dashboard">Dashboard</Link>}
        </div>

        <div className="nav-actions anim-slide-right delay-200">
          {isAuth ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ borderRadius: "var(--radius-full)", padding: "8px 22px", fontSize: "0.8125rem" }}>
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/auth?tab=signin" className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem" }}>Sign In</Link>
              <Link href="/auth?tab=signup" className="btn btn-primary" style={{ borderRadius: "var(--radius-full)", padding: "8px 22px", fontSize: "0.8125rem", boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ═══ HERO ════════════════════════════════════════════════════════ */}
      <section id="hero" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
        <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.02) 20%, transparent 42%, transparent 68%, rgba(0,0,0,0.12) 86%, rgba(0,0,0,0.92) 100%)" }} />

        {/* Floating particles */}
        {[
          { w: 5, h: 5, c: "rgba(16,185,129,0.25)", t: "22%", l: "12%", d: "0s" },
          { w: 4, h: 4, c: "rgba(255,215,0,0.18)", t: "38%", r: "18%", d: "2s" },
          { w: 7, h: 7, c: "rgba(255,255,255,0.06)", t: "62%", l: "82%", d: "4s" },
        ].map((p, i) => (
          <div key={i} className="particle" style={{ width: p.w, height: p.h, background: p.c, top: p.t, left: p.l, right: p.r, animationDelay: p.d }} />
        ))}

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 860, padding: "0 24px" }}>
          <div className="anim-fade-up delay-300" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", background: "rgba(0,0,0,0.45)", borderRadius: "var(--radius-full)",
            border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
            marginBottom: 40, fontSize: "0.75rem", fontWeight: 500,
            color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <Sparkles size={12} color="#10b981" />
            Introducing YieldSmart
          </div>

          <h1 className="anim-fade-up delay-400" style={{
            fontSize: "clamp(2.8rem, 8vw, 5.25rem)", fontWeight: 700, letterSpacing: "-0.03em",
            lineHeight: 1.08, marginBottom: 32, fontFamily: "var(--font-display)",
            textShadow: "0 4px 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.85)",
          }}>
            <span style={{ color: "#FFFFFF" }}>Your farm deserves</span><br />
            <span style={{ color: "#D4AF37", fontStyle: "italic", textShadow: "0 0 60px rgba(212,175,55,0.25), 0 4px 40px rgba(0,0,0,0.8)" }}>
              better intelligence.
            </span>
          </h1>

          <p className="anim-fade-up delay-500" style={{
            fontSize: "clamp(0.95rem, 2vw, 1.15rem)", color: "rgba(255,255,255,0.8)",
            maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.7,
            textShadow: "0 2px 20px rgba(0,0,0,0.9)",
          }}>
            Satellite-grade weather data, soil science, and a neural network trained on 48 crop diseases — so you spend less time guessing and more time growing.
          </p>

          <p className="anim-fade-up delay-500" style={{
            fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontStyle: "italic",
            fontFamily: "var(--font-display)", marginBottom: 48, textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}>
            &ldquo;Where data meets the soil.&rdquo;
          </p>

          <div className="anim-fade-up delay-600" style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link href={isAuth ? "/dashboard" : "/auth?tab=signup"} className="btn btn-primary" style={{
              padding: "14px 34px", fontSize: "0.875rem", borderRadius: "var(--radius-full)",
              boxShadow: "0 0 30px rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.3)", fontWeight: 600,
            }}>
              Get Started — It&apos;s Free <ArrowRight size={16} />
            </Link>
            <Link href="#features" className="btn" style={{
              padding: "14px 34px", fontSize: "0.875rem", borderRadius: "var(--radius-full)",
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
            }}>
              See How It Works
            </Link>
          </div>
        </div>

        <div className="scroll-indicator" style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Scroll</span>
          <ChevronDown size={16} color="rgba(255,255,255,0.35)" />
        </div>
      </section>

      {/* ═══ STATS BAR ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "52px 24px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="reveal" style={{ ...revealStyle(0), maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32, textAlign: "center" }}>
          {[
            { value: "48+", label: "Diseases Identified" },
            { value: "< 2s", label: "Scan Speed" },
            { value: "5-Day", label: "Forecast Depth" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "140px 24px 160px", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>
        {/* Radial glow accent */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          {/* Section header */}
          <div className="reveal" style={{ ...revealStyle(0), textAlign: "center", marginBottom: 80 }}>
            <div style={{
              display: "inline-flex", padding: "5px 14px",
              background: "rgba(16,185,129,0.08)", borderRadius: "var(--radius-full)",
              border: "1px solid rgba(16,185,129,0.18)",
              fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "var(--accent-primary)", marginBottom: 20,
            }}>✦ &nbsp;What&apos;s Inside</div>
            <h2 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 18, fontFamily: "var(--font-display)" }}>
              Three tools.<br />
              <span style={{ color: "var(--text-secondary)", fontStyle: "italic", fontWeight: 400 }}>One dashboard.</span>
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Everything a modern farmer needs to monitor field health, catch diseases early, and make confident planting decisions.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 24 }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="reveal feature-card"
                style={{
                  ...revealStyle(i * 0.13),
                  borderRadius: "var(--radius-xl)",
                  border: `1px solid ${f.border}`,
                  background: f.bg,
                  backdropFilter: "blur(12px)",
                  padding: "40px 32px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`, opacity: 0.6 }} />

                {/* Tag badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: "var(--radius-full)",
                  background: `${f.color}18`, border: `1px solid ${f.color}30`,
                  fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: f.color, marginBottom: 28,
                }}>
                  {f.tag}
                </div>

                {/* Icon + stat */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "var(--radius-lg)",
                    background: `${f.color}12`, border: `1px solid ${f.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: f.color, lineHeight: 1 }}>{f.stat}</div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginTop: 3 }}>{f.statLabel}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 14, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PULL QUOTE ══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", textAlign: "center" }}>
        <div className="reveal" style={{ ...revealStyle(0), maxWidth: 700, margin: "0 auto" }}>
          <Leaf size={28} color="var(--accent-primary)" style={{ marginBottom: 28, opacity: 0.4 }} />
          <blockquote style={{ fontSize: "clamp(1.2rem,3vw,1.6rem)", fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 24 }}>
            &ldquo;Good farming is about observation. Great farming is about knowing what you&apos;re looking at.&rdquo;
          </blockquote>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)" }}>
            — The YieldSmart Philosophy
          </p>
        </div>
      </section>

      {/* ═══ TEAM ════════════════════════════════════════════════════════ */}
      <section id="team" style={{ padding: "140px 24px 160px", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(212,175,55,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div className="reveal" style={{ ...revealStyle(0), textAlign: "center", marginBottom: 80 }}>
            <div style={{
              display: "inline-flex", padding: "5px 14px",
              background: "rgba(212,175,55,0.06)", borderRadius: "var(--radius-full)",
              border: "1px solid rgba(212,175,55,0.15)",
              fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#D4AF37", marginBottom: 20,
            }}>✦ &nbsp;The People Behind It</div>

            <h2 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 18, fontFamily: "var(--font-display)" }}>
              Built by four engineers<br />
              <span style={{ color: "var(--text-tertiary)", fontStyle: "italic", fontWeight: 400, fontSize: "0.9em" }}>who care about agriculture.</span>
            </h2>
          </div>

          {/* Team grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {innovators.map((p, i) => (
              <div
                key={i}
                className="reveal innovator-card"
                style={{
                  ...revealStyle(i * 0.1),
                  padding: "40px 28px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Subtle corner glow */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 100, height: 100, background: `radial-gradient(circle at top right, ${p.color}12, transparent 70%)`, pointerEvents: "none" }} />

                {/* Avatar with colored ring */}
                <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${p.color}20 0%, ${p.color}08 100%)`,
                    border: `2px solid ${p.color}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-display)", color: p.color,
                    margin: "0 auto",
                    boxShadow: `0 0 20px ${p.color}15`,
                  }}>
                    {p.initials}
                  </div>
                  {/* Online dot */}
                  <div style={{ position: "absolute", bottom: 3, right: 3, width: 12, height: 12, borderRadius: "50%", background: p.color, border: "2px solid var(--bg-secondary)", boxShadow: `0 0 8px ${p.color}` }} />
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 5, fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{p.name}</h3>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: p.color, marginBottom: 16, opacity: 0.85 }}>
                  {p.role}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.84rem", lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════════════════ */}
      <footer style={{ padding: "48px 24px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", background: "var(--bg-secondary)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <Leaf size={16} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-display)" }}>YieldSmart</span>
        </div>
        <p style={{ color: "var(--text-tertiary)", fontSize: "0.78rem" }}>
          © {new Date().getFullYear()} YieldSmart. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
