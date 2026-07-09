"use client";

import { SoilData } from "@/lib/api";
import { useEffect, useState } from "react";

interface SoilPanelProps {
  soil: SoilData;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(value), 300); }, [value]);

  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  green: "var(--gradient-green)",
  blue:  "linear-gradient(90deg, #3b82f6, #1d4ed8)",
  amber: "var(--gradient-amber)",
  red:   "linear-gradient(90deg, #ef4444, #b91c1c)",
};

export default function SoilPanel({ soil }: SoilPanelProps) {
  return (
    <div className="section-card fade-in-up" style={{ animationDelay: "0.1s" }}>
      <div className="section-header">
        <div>
          <div className="section-title">🌱 Soil Conditions</div>
          <div className="section-subtitle">Estimated from live weather data</div>
        </div>
      </div>

      {/* Moisture */}
      <div className="soil-metric">
        <div className="soil-metric-header">
          <span className="soil-metric-name">💧 Soil Moisture</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="soil-metric-value">{soil.moisture_pct}%</span>
            <span className={`stat-badge badge-${
              soil.moisture_color === "green" ? "green" :
              soil.moisture_color === "blue"  ? "blue"  :
              soil.moisture_color === "amber" ? "amber" : "red"
            }`}>
              {soil.moisture_level}
            </span>
          </div>
        </div>
        <ProgressBar value={soil.moisture_pct} color={COLOR_MAP[soil.moisture_color] || "var(--gradient-green)"} />
      </div>

      {/* Nitrogen */}
      <div className="soil-metric">
        <div className="soil-metric-header">
          <span className="soil-metric-name">🧪 Nitrogen Level</span>
          <span className="soil-metric-value">{soil.nitrogen}</span>
        </div>
        <ProgressBar value={soil.nitrogen_pct} color="linear-gradient(90deg, #14b8a6, #0d9488)" />
      </div>

      {/* Metric rows */}
      <div style={{ marginTop: 20 }}>
        {[
          { icon: "🌡️", label: "Soil Temperature", value: `${soil.soil_temp}°C` },
          { icon: "⚗️",  label: "pH Level",         value: soil.ph_label },
        ].map((m) => (
          <div className="metric-row" key={m.label}>
            <span className="metric-label">
              <span>{m.icon}</span> {m.label}
            </span>
            <span className="metric-value">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Note */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 14px",
          background: "var(--bg-glass-light)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span>ℹ️</span>
        <span>{soil.note}</span>
      </div>
    </div>
  );
}
