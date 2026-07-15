/**
 * lib/profile.ts — Farmer profile settings (stored in localStorage)
 * No backend needed. Syncs to server can be added later.
 */

export type LocationMode = "gps" | "manual";
export type CropFocus =
  | "Mixed / General"
  | "Rice / Paddy"
  | "Wheat"
  | "Vegetables"
  | "Fruits"
  | "Sugarcane"
  | "Cotton"
  | "Pulses / Lentils"
  | "Maize / Corn"
  | "Oilseeds";

export type SoilType = "Loamy" | "Sandy" | "Clay" | "Silty" | "Peaty" | "Chalky" | "Not Sure";

export interface FarmerProfile {
  farmName: string;
  cropFocus: CropFocus;
  farmSizeAcres: number | null;
  soilType: SoilType;
  locationMode: LocationMode;
  // Saved GPS coords (set when farmer taps "Use My Location")
  savedLat: number | null;
  savedLon: number | null;
  // Human-readable location label (village/city from reverse-geocode)
  locationLabel: string;
  // Whether the user has explicitly set their location at least once
  locationConfirmed: boolean;
}

const PROFILE_KEY = "ys_farmer_profile_v1";

export const DEFAULT_PROFILE: FarmerProfile = {
  farmName: "",
  cropFocus: "Mixed / General",
  farmSizeAcres: null,
  soilType: "Not Sure",
  locationMode: "manual",
  savedLat: null,
  savedLon: null,
  locationLabel: "",
  locationConfirmed: false,
};

export function getProfile(): FarmerProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: Partial<FarmerProfile>): FarmerProfile {
  const current = getProfile();
  const next = { ...current, ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

/** Returns the city to use for the dashboard API call */
export function getDashboardCity(fallbackCity: string): string {
  const p = getProfile();
  if (p.locationMode === "gps" && p.locationLabel) return p.locationLabel;
  return fallbackCity;
}

export const CROP_OPTIONS: CropFocus[] = [
  "Mixed / General",
  "Rice / Paddy",
  "Wheat",
  "Vegetables",
  "Fruits",
  "Sugarcane",
  "Cotton",
  "Pulses / Lentils",
  "Maize / Corn",
  "Oilseeds",
];

export const SOIL_OPTIONS: SoilType[] = [
  "Not Sure",
  "Loamy",
  "Sandy",
  "Clay",
  "Silty",
  "Peaty",
  "Chalky",
];
