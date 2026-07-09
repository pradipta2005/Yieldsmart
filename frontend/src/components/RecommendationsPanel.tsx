"use client";

import { CropRec, FarmAlert, IrrigationSched } from "@/lib/api";

interface RecommendationsPanelProps {
  crops: CropRec[];
  alerts: FarmAlert[];
  irrigation: IrrigationSched;
  season: string;
}

const SEASON_INFO: Record<string, { emoji: string; label: string }> = {
  kharif: { emoji: "🌧️", label: "Kharif Season" },
  rabi:   { emoji: "❄️", label: "Rabi Season" },
  summer: { emoji: "☀️", label: "Summer Season" },
};

export default function RecommendationsPanel({
  crops,
  alerts,
  irrigation,
  season,
}: RecommendationsPanelProps) {
  const seasonInfo = SEASON_INFO[season] || { emoji: "🌿", label: "Current Season" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Farming Alerts ── */}
      <div className="section-card fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="section-header">
          <div>
            <div className="section-title">⚠️ Farm Alerts</div>
            <div className="section-subtitle">Based on current conditions</div>
          </div>
          <span
            className={`stat-badge ${
              alerts.some((a) => a.type === "danger")  ? "badge-red" :
              alerts.some((a) => a.type === "warning") ? "badge-amber" : "badge-green"
            }`}
          >
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div>
          {alerts.map((alert, i) => (
            <div key={i} className={`alert-banner ${alert.type}`}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{alert.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 2 }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {alert.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Irrigation Schedule ── */}
      <div className="section-card fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          💦 Irrigation Schedule
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "🌅", label: "Morning Window", value: irrigation.morning },
            { icon: "🌆", label: "Evening Window", value: irrigation.evening },
            { icon: "📅", label: "Frequency",      value: irrigation.frequency },
          ].map((m) => (
            <div className="metric-row" key={m.label}>
              <span className="metric-label">
                <span>{m.icon}</span> {m.label}
              </span>
              <span className="metric-value" style={{ fontSize: "0.9rem" }}>{m.value}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "var(--accent-blue-dim)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8rem",
            color: "var(--accent-blue)",
          }}
        >
          💡 {irrigation.reason}
        </div>
      </div>

      {/* ── Best Crops This Season ── */}
      <div className="section-card fade-in-up" style={{ animationDelay: "0.25s" }}>
        <div className="section-header">
          <div>
            <div className="section-title">🌿 Best Crops to Grow</div>
            <div className="section-subtitle">Matched to your weather & {seasonInfo.label}</div>
          </div>
          <div className="season-badge">
            <span className="season-emoji">{seasonInfo.emoji}</span>
            <span className="season-label">Season</span>
            <span className="season-name" style={{ textTransform: "capitalize" }}>{season}</span>
          </div>
        </div>

        {crops.length > 0 ? (
          <div className="grid-auto stagger">
            {crops.map((crop) => (
              <div key={crop.name} className="crop-card fade-in-up">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="crop-emoji">{crop.emoji}</span>
                  <span className="stat-badge badge-green" style={{ fontSize: "0.72rem" }}>
                    {crop.score}% match
                  </span>
                </div>
                <div>
                  <div className="crop-name">{crop.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {crop.soil_type}
                  </div>
                </div>
                <div className="crop-tip">{crop.tip}</div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🔍</div>
            <div>No specific crop matches for current conditions.</div>
            <div style={{ fontSize: "0.82rem", marginTop: 4 }}>Consult a local agronomist.</div>
          </div>
        )}
      </div>
    </div>
  );
}
