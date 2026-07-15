/**
 * lib/api.ts — YieldSmart API client v2 (with auth)
 */
import { authHeaders } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T>(url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<T> {
  try {
    const res = await fetch(`${BASE}${url}`, {
      headers: { "Content-Type": "application/json", ...authHeaders(), ...(options?.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const isGet = !options || !options.method || options.method.toUpperCase() === "GET";
    if (isGet && retries > 0 && error instanceof Error) {
      console.warn(`Fetch failed (${error.message}), retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return req<T>(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number; name: string; email: string; city: string;
  initials?: string; created_at?: string;
}
export interface AuthResponse { token: string; user: AuthUser; }

export const apiSignUp = (body: { name:string; email:string; password:string; city:string }) =>
  req<AuthResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) });

export const apiSignIn = (body: { email:string; password:string }) =>
  req<AuthResponse>("/api/auth/signin", { method: "POST", body: JSON.stringify(body) });

export const apiMe = () => req<AuthUser & { total_scans:number; diseases_found:number; healthy:number }>("/api/auth/me");

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface WeatherData {
  city: string; country: string; temp: number; feels_like: number;
  temp_min: number; temp_max: number; humidity: number; pressure: number;
  wind_speed: number; wind_deg: number; visibility: number;
  description: string; icon_code: string; icon_emoji: string;
  sunrise: string; sunset: string; clouds: number; uv_index: number|null;
}
export interface SoilData {
  moisture_pct: number; moisture_level: string; moisture_color: string;
  soil_temp: number; ph: number; ph_label: string;
  nitrogen: string; nitrogen_pct: number; note: string;
}
export interface CropRec {
  name: string; emoji: string; tip: string; soil_type: string;
  score: number; season: string[];
}
export interface FarmAlert { type: string; icon: string; title: string; message: string; }
export interface IrrigationSched { morning: string; evening: string; frequency: string; reason: string; }
export interface ForecastDay {
  date: string; day: string; temp_max: number; temp_min: number;
  humidity: number; icon_emoji: string; description: string;
}
export interface DashboardData {
  weather: WeatherData; soil: SoilData; crops: CropRec[];
  alerts: FarmAlert[]; irrigation: IrrigationSched;
  forecast: ForecastDay[]; season: string;
}
export const apiDashboard = (city: string, lat?: number | null, lon?: number | null) => {
  // Use GPS coordinates when available for accurate rural weather data
  if (lat != null && lon != null) {
    return req<DashboardData>(`/api/dashboard?lat=${lat}&lon=${lon}`);
  }
  return req<DashboardData>(`/api/dashboard?city=${encodeURIComponent(city)}`);
};

// ── Disease ───────────────────────────────────────────────────────────────────
export interface Treatment { method: string; ratio: string; frequency: string; }
export interface DiseaseInfo {
  display: string; severity: "none"|"moderate"|"severe"|"critical";
  cause: string; symptoms: string; treatments: Treatment[];
  prevention: string[]; organic: boolean;
}
export interface DiseaseResult {
  label: string; confidence: number;
  top3: {label:string; confidence:number}[];
  disease_info: DiseaseInfo;
  is_valid_leaf?: boolean;
  warning?: string | null;
}
export async function apiDetect(file: File): Promise<DiseaseResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/detect-disease`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail);
  }
  return res.json();
}

// ── History ───────────────────────────────────────────────────────────────────
export interface ScanHistoryItem {
  id: number; plant: string; disease: string; severity: string;
  confidence: number; scanned_at: string;
  result_json?: string;
}
export interface HistoryData {
  history: ScanHistoryItem[];
  stats: { total_scans: number; diseases_found: number; healthy: number };
}
export const apiHistory = () => req<HistoryData>("/api/history");
