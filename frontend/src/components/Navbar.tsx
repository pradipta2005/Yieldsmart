"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { Leaf, LayoutDashboard, ScanLine, History, LogOut, MapPin, ChevronDown, Sun, Moon, UserCircle, Navigation } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; city: string; initials?: string } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [isGPS, setIsGPS] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const u = getUser();
    setUser(u);

    // Load profile for location badge
    const p = getProfile();
    if (p.locationLabel) {
      setLocationLabel(p.locationLabel);
      setIsGPS(p.locationMode === "gps");
    } else if (u?.city) {
      setLocationLabel(u.city);
      setIsGPS(false);
    }

    // Theme initialization
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") document.body.classList.add("light-theme");
      else document.body.classList.remove("light-theme");
    } else {
      localStorage.setItem("theme", "dark");
      document.body.classList.remove("light-theme");
    }

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Re-read profile whenever menu closes (picks up location changes from profile page)
  useEffect(() => {
    if (!menuOpen) {
      const p = getProfile();
      const u = getUser();
      if (p.locationLabel) {
        setLocationLabel(p.locationLabel);
        setIsGPS(p.locationMode === "gps");
      } else if (u?.city) {
        setLocationLabel(u.city);
        setIsGPS(false);
      }
    }
  }, [menuOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") document.body.classList.add("light-theme");
    else document.body.classList.remove("light-theme");
  };

  const handleLogout = () => { clearAuth(); router.push("/"); };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/disease",   label: "Scanner",   icon: <ScanLine size={16} /> },
    { href: "/history",   label: "History",   icon: <History size={16} /> },
  ];

  const initials = user?.initials ||
    (user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?");

  return (
    <nav className={`navbar-comp ${scrolled ? "scrolled" : ""}`}>
      {/* Brand */}
      <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <div className="brand-logo-container">
          <Leaf size={15} color="var(--accent-primary)" />
        </div>
        <span className="brand-text">YieldSmart</span>
      </Link>

      {/* Nav links */}
      <div className="navbar-links-container">
        {navLinks.map(l => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={`navbar-item-link ${active ? "active" : ""}`}>
              {l.icon}
              <span className="nav-text-label">{l.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        {/* Location badge — GPS or manual city, click to open Profile */}
        {locationLabel && (
          <Link
            href="/profile"
            className="user-city-badge"
            title="Update location in Profile"
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            {isGPS
              ? <Navigation size={11} style={{ color: "var(--accent-primary)" }} />
              : <MapPin size={12} />}
            <span className="city-text">{locationLabel.split(",")[0]}</span>
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Language Toggle */}
        <LanguageToggle />

        {/* User dropdown */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(p => !p)} className="user-profile-btn">
            <div className="user-avatar-initials">{initials}</div>
            <ChevronDown size={12} className={`chevron-indicator ${menuOpen ? "open" : ""}`} />
          </button>

          {menuOpen && (
            <div className="navbar-dropdown-panel" onClick={() => setMenuOpen(false)}>
              <div className="dropdown-user-info">
                <div className="user-display-name">{user?.name}</div>
                <div className="user-display-city" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {isGPS ? <Navigation size={10} color="var(--accent-primary)" /> : <MapPin size={10} />}
                  {locationLabel || user?.city}
                </div>
              </div>

              <Link
                href="/profile"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", textDecoration: "none",
                  color: "var(--text-secondary)", fontSize: "0.85rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <UserCircle size={14} /> Farm Profile & Settings
              </Link>

              <button onClick={handleLogout} className="dropdown-signout-btn">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
