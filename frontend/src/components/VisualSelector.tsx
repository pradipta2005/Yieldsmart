"use client";
import { ReactNode } from "react";

export interface Option<T> {
  value: T;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface Props<T> {
  options: Option<T>[];
  selected: T | null;
  onSelect: (val: T) => void;
  gridCols?: 2 | 3;
}

export default function VisualSelector<T extends string | number>({ options, selected, onSelect, gridCols = 2 }: Props<T>) {
  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: `repeat(${gridCols}, 1fr)`, 
      gap: 12 
    }}>
      {options.map(opt => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={(e) => { e.preventDefault(); onSelect(opt.value); }}
            className={`premium-glass-card ${isActive ? "active" : ""}`}
            style={{
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              minHeight: 110,
              border: isActive ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
              background: isActive ? "rgba(210, 245, 71, 0.05)" : "var(--bg-secondary)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isActive ? "translateY(-2px)" : "none",
              boxShadow: isActive ? "0 8px 24px rgba(210,245,71,0.15)" : "none",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            {opt.icon && (
              <div style={{ 
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center" 
              }}>
                {opt.icon}
              </div>
            )}
            <div style={{ 
              fontWeight: isActive ? 700 : 600, 
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: "0.9rem"
            }}>
              {opt.label}
            </div>
            {opt.description && (
              <div style={{ 
                fontSize: "0.75rem", 
                color: "var(--text-tertiary)", 
                marginTop: 2, 
                lineHeight: 1.4 
              }}>
                {opt.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
