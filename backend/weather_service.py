import os
import requests
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"


WEATHER_ICON_MAP = {
    "01d": "☀️", "01n": "🌙",
    "02d": "⛅", "02n": "⛅",
    "03d": "☁️", "03n": "☁️",
    "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌦️",
    "11d": "⛈️", "11n": "⛈️",
    "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
}

def get_current_weather(city: str) -> dict:
    """Fetch current weather for a given city."""
    if not OPENWEATHER_API_KEY:
        raise ValueError("Weather service API key is missing. Add OPENWEATHER_API_KEY to the backend .env file.")
    url = f"{BASE_URL}/weather"
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        icon_code = data["weather"][0]["icon"]
        return {
            "city": data["name"],
            "country": data["sys"]["country"],
            "temp": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "temp_min": round(data["main"]["temp_min"], 1),
            "temp_max": round(data["main"]["temp_max"], 1),
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": round(data["wind"]["speed"] * 3.6, 1),  # m/s to km/h
            "wind_deg": data["wind"].get("deg", 0),
            "visibility": data.get("visibility", 10000) // 1000,  # meters to km
            "description": data["weather"][0]["description"].title(),
            "icon_code": icon_code,
            "icon_emoji": WEATHER_ICON_MAP.get(icon_code, "🌡️"),
            "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"]).strftime("%I:%M %p"),
            "sunset": datetime.fromtimestamp(data["sys"]["sunset"]).strftime("%I:%M %p"),
            "clouds": data["clouds"]["all"],
            "uv_index": None,  # would need separate call
        }
    except requests.exceptions.HTTPError as e:
        if resp.status_code == 404:
            raise ValueError(f"City '{city}' not found. Please check the spelling.")
        raise ValueError(f"Weather API error: {str(e)}")
    except requests.exceptions.ConnectionError:
        raise ValueError("Cannot connect to weather service. Check your internet connection.")
    except Exception as e:
        raise ValueError(f"Weather fetch failed: {str(e)}")

def get_forecast(city: str) -> list:
    """Fetch 5-day / 3-hour forecast and return daily summaries."""
    if not OPENWEATHER_API_KEY:
        return []
    url = f"{BASE_URL}/forecast"
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # Aggregate by day
        daily = {}
        for entry in data["list"]:
            date = entry["dt_txt"].split(" ")[0]
            if date not in daily:
                daily[date] = {
                    "date": date,
                    "temps": [],
                    "humidity": [],
                    "icons": [],
                    "descriptions": []
                }
            daily[date]["temps"].append(entry["main"]["temp"])
            daily[date]["humidity"].append(entry["main"]["humidity"])
            daily[date]["icons"].append(entry["weather"][0]["icon"])
            daily[date]["descriptions"].append(entry["weather"][0]["description"])

        result = []
        for date, info in list(daily.items())[:5]:
            dt = datetime.strptime(date, "%Y-%m-%d")
            day_name = dt.strftime("%a") if dt.date() != datetime.today().date() else "Today"
            icon = info["icons"][len(info["icons"]) // 2]  # midday icon
            result.append({
                "date": date,
                "day": day_name,
                "temp_max": round(max(info["temps"]), 1),
                "temp_min": round(min(info["temps"]), 1),
                "humidity": round(sum(info["humidity"]) / len(info["humidity"])),
                "icon_emoji": WEATHER_ICON_MAP.get(icon, "🌡️"),
                "description": info["descriptions"][len(info["descriptions"]) // 2].title()
            })

        return result
    except Exception as e:
        return []  # Return empty forecast gracefully


def get_weather_by_coords(lat: float, lon: float) -> dict:
    """Fetch current weather by GPS coordinates — more accurate than city name."""
    if not OPENWEATHER_API_KEY:
        raise ValueError("Weather service API key is missing.")
    url = f"{BASE_URL}/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        icon_code = data["weather"][0]["icon"]
        return {
            "city": data.get("name", "Your Farm"),
            "country": data["sys"]["country"],
            "temp": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "temp_min": round(data["main"]["temp_min"], 1),
            "temp_max": round(data["main"]["temp_max"], 1),
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": round(data["wind"]["speed"] * 3.6, 1),
            "wind_deg": data["wind"].get("deg", 0),
            "visibility": data.get("visibility", 10000) // 1000,
            "description": data["weather"][0]["description"].title(),
            "icon_code": icon_code,
            "icon_emoji": WEATHER_ICON_MAP.get(icon_code, "🌡️"),
            "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"]).strftime("%I:%M %p"),
            "sunset": datetime.fromtimestamp(data["sys"]["sunset"]).strftime("%I:%M %p"),
            "clouds": data["clouds"]["all"],
            "uv_index": None,
        }
    except requests.exceptions.ConnectionError:
        raise ValueError("Cannot connect to weather service.")
    except Exception as e:
        raise ValueError(f"Weather fetch failed: {str(e)}")


def get_forecast_by_coords(lat: float, lon: float) -> list:
    """Fetch 5-day forecast by GPS coordinates."""
    if not OPENWEATHER_API_KEY:
        return []
    url = f"{BASE_URL}/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        daily = {}
        for entry in data["list"]:
            date = entry["dt_txt"].split(" ")[0]
            if date not in daily:
                daily[date] = {"date": date, "temps": [], "humidity": [], "icons": [], "descriptions": []}
            daily[date]["temps"].append(entry["main"]["temp"])
            daily[date]["humidity"].append(entry["main"]["humidity"])
            daily[date]["icons"].append(entry["weather"][0]["icon"])
            daily[date]["descriptions"].append(entry["weather"][0]["description"])
        result = []
        for date, info in list(daily.items())[:5]:
            dt = datetime.strptime(date, "%Y-%m-%d")
            day_name = dt.strftime("%a") if dt.date() != datetime.today().date() else "Today"
            icon = info["icons"][len(info["icons"]) // 2]
            result.append({
                "date": date, "day": day_name,
                "temp_max": round(max(info["temps"]), 1),
                "temp_min": round(min(info["temps"]), 1),
                "humidity": round(sum(info["humidity"]) / len(info["humidity"])),
                "icon_emoji": WEATHER_ICON_MAP.get(icon, "🌡️"),
                "description": info["descriptions"][len(info["descriptions"]) // 2].title()
            })
        return result
    except Exception:
        return []
