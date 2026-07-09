"use client";

import { WeatherData, ForecastDay } from "@/lib/api";
import { useEffect, useState } from "react";

interface WeatherCardProps {
  weather: WeatherData;
  forecast: ForecastDay[];
}

const WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function getWindDir(deg: number) {
  return WIND_DIRS[Math.round(deg / 45) % 8];
}

export default function WeatherCard({ weather, forecast }: WeatherCardProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div
      className="section-card fade-in-up"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease, transform 0.5s ease",
        gridColumn: "span 2",
      }}
    >
      <div className="section-header">
        <div>
          <div className="section-title">🌤️ Live Weather</div>
          <div className="section-subtitle">
            {weather.city}, {weather.country} · Updated just now
          </div>
        </div>
        <span className="stat-badge badge-green">Live</span>
      </div>

      {/* Main temp + icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div className="weather-main-temp">{weather.temp}°C</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "1rem", marginTop: 4 }}>
            {weather.description}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginTop: 4 }}>
            Feels like {weather.feels_like}°C · H:{weather.temp_max}° L:{weather.temp_min}°
          </div>
        </div>
        <div className="weather-icon float-anim">{weather.icon_emoji}</div>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { icon: "💧", label: "Humidity",   value: `${weather.humidity}%` },
          { icon: "💨", label: "Wind",       value: `${weather.wind_speed} km/h ${getWindDir(weather.wind_deg)}` },
          { icon: "👁️",  label: "Visibility", value: `${weather.visibility} km` },
          { icon: "🌡️", label: "Pressure",   value: `${weather.pressure} hPa` },
          { icon: "🌅", label: "Sunrise",    value: weather.sunrise },
          { icon: "🌇", label: "Sunset",     value: weather.sunset },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              padding: "12px 14px",
              background: "var(--bg-glass-light)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* 5-day forecast */}
      {forecast.length > 0 && (
        <>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
            5-Day Forecast
          </div>
          <div className="forecast-strip">
            {forecast.map((day) => (
              <div key={day.date} className="forecast-day">
                <span className="day-name">{day.day}</span>
                <span className="day-icon">{day.icon_emoji}</span>
                <span className="day-temp">{day.temp_max}°</span>
                <span className="day-low">{day.temp_min}°</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
