/**
 * lib/location.ts — GPS location + reverse-geocoding utilities
 * Uses browser Geolocation API + free Nominatim (OpenStreetMap) for reverse-geocoding.
 * No API key required.
 */

export interface LocationResult {
  lat: number;
  lon: number;
  /** Human-readable display name, e.g. "Kolkata, West Bengal" */
  displayName: string;
  /** Short city name for passing to weather API */
  city: string;
  /** Village/town/suburb if available (more rural-friendly) */
  locality: string;
}

/**
 * Request GPS coordinates from the browser.
 * Returns a promise that resolves or rejects with a friendly error message.
 */
export function requestGPSCoords(
  timeoutMs = 12000
): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      err => {
        if (err.code === 1) reject(new Error("Location access denied. Please allow GPS and try again."));
        else if (err.code === 2) reject(new Error("Location unavailable. Move to an open area and retry."));
        else reject(new Error("Location request timed out. Try again."));
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 30_000, // Accept cached position up to 30s old
      }
    );
  });
}

/**
 * Reverse-geocode lat/lon → human-readable location.
 * Uses Nominatim (OpenStreetMap) — free, no API key.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<LocationResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "YieldSmart/2.0" },
  });
  if (!res.ok) throw new Error("Geocoding service unavailable. Try again.");
  const data = await res.json();
  const addr = data.address || {};

  // Prefer most rural-specific names first
  const locality =
    addr.village || addr.town || addr.suburb ||
    addr.county || addr.district || "";

  const city =
    addr.city || addr.town || addr.village ||
    addr.county || addr.state_district || addr.state || "Unknown";

  const state = addr.state || "";
  const country = addr.country_code?.toUpperCase() || "";

  const displayName = [locality || city, state, country]
    .filter(Boolean)
    .join(", ");

  return { lat, lon, displayName, city, locality };
}

/**
 * One-shot: request GPS and reverse-geocode in one call.
 */
export async function getLocationWithLabel(): Promise<LocationResult> {
  const { lat, lon } = await requestGPSCoords();
  return reverseGeocode(lat, lon);
}
