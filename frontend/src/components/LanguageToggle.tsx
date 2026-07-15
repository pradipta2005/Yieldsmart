"use client";
import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

// The top 30 languages used by farmers globally
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "yo", label: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "am", label: "አማርኛ", flag: "🇪🇹" },
  { code: "fil", label: "Filipino", flag: "🇵🇭" },
  { code: "my", label: "မြန်မာဘာသာ", flag: "🇲🇲" },
  { code: "km", label: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
];

function triggerGoogleTranslate(langCode: string) {
  // The canonical way to trigger Google Translate programmatically
  const selectEl = document.querySelector<HTMLSelectElement>(
    ".goog-te-combo"
  );
  if (selectEl) {
    selectEl.value = langCode;
    selectEl.dispatchEvent(new Event("change"));
  }
}

export default function LanguageToggle() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = LANGUAGES.filter(
    (l) =>
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (lang: typeof LANGUAGES[0]) => {
    setSelected(lang);
    setOpen(false);
    setSearch("");
    triggerGoogleTranslate(lang.code);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 99,
          color: "var(--text-secondary)",
          fontSize: "0.78rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-primary)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
        title="Change Language"
        aria-label="Change language"
      >
        <Globe size={14} />
        <span>{selected.flag} {selected.label}</span>
        <ChevronDown
          size={12}
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 240,
            maxHeight: 360,
            overflowY: "auto",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
            <input
              autoFocus
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: "0.8rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {/* Language List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: selected.code === lang.code ? "var(--accent-muted)" : "transparent",
                  border: "none",
                  color: selected.code === lang.code ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: selected.code === lang.code ? 700 : 400,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (selected.code !== lang.code)
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (selected.code !== lang.code)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {selected.code === lang.code && <Check size={13} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8rem" }}>
                No language found
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
            <p style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", textAlign: "center" }}>
              Powered by Google Translate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
