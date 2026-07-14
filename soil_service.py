"""
soil_service.py — Soil condition estimation & crop recommendation engine
"""
from datetime import datetime

# Crop database with temperature/humidity suitability ranges
CROP_DATABASE = [
    {
        "name": "Rice", "emoji": "🌾",
        "temp_min": 20, "temp_max": 38, "humidity_min": 70,
        "season": ["kharif"],
        "tip": "Ensure standing water of 5–7 cm depth during vegetative stage.",
        "soil_type": "Clay loam"
    },
    {
        "name": "Wheat", "emoji": "🌿",
        "temp_min": 10, "temp_max": 25, "humidity_min": 40,
        "season": ["rabi"],
        "tip": "Sow when soil temp is below 20°C. First irrigation at 20–25 DAS.",
        "soil_type": "Loam to clay loam"
    },
    {
        "name": "Cotton", "emoji": "🌸",
        "temp_min": 21, "temp_max": 37, "humidity_min": 50,
        "season": ["kharif"],
        "tip": "Deep tillage before sowing. Requires well-drained soils.",
        "soil_type": "Black cotton soil"
    },
    {
        "name": "Maize", "emoji": "🌽",
        "temp_min": 18, "temp_max": 32, "humidity_min": 50,
        "season": ["kharif", "rabi"],
        "tip": "Apply nitrogen in 3 split doses. Sensitive to waterlogging.",
        "soil_type": "Sandy loam"
    },
    {
        "name": "Tomato", "emoji": "🍅",
        "temp_min": 18, "temp_max": 29, "humidity_min": 50,
        "season": ["kharif", "rabi", "summer"],
        "tip": "Stake plants for support. Monitor humidity — blight risk above 80%.",
        "soil_type": "Sandy loam with good drainage"
    },
    {
        "name": "Potato", "emoji": "🥔",
        "temp_min": 14, "temp_max": 24, "humidity_min": 60,
        "season": ["rabi"],
        "tip": "Plant when soil temp is 10–18°C. Hill up soil around stems.",
        "soil_type": "Sandy loam"
    },
    {
        "name": "Onion", "emoji": "🧅",
        "temp_min": 13, "temp_max": 30, "humidity_min": 55,
        "season": ["rabi", "kharif"],
        "tip": "Avoid water stress at bulb formation stage.",
        "soil_type": "Loamy to silt loam"
    },
    {
        "name": "Sugarcane", "emoji": "🎋",
        "temp_min": 20, "temp_max": 38, "humidity_min": 65,
        "season": ["kharif"],
        "tip": "Ratoon crop possible. Requires 200–250 cm water in its lifecycle.",
        "soil_type": "Deep loam"
    },
    {
        "name": "Soybean", "emoji": "🟡",
        "temp_min": 20, "temp_max": 30, "humidity_min": 60,
        "season": ["kharif"],
        "tip": "Inoculate seeds with Rhizobium. Avoid waterlogging.",
        "soil_type": "Well-drained loam"
    },
    {
        "name": "Chilli", "emoji": "🌶️",
        "temp_min": 20, "temp_max": 30, "humidity_min": 55,
        "season": ["kharif", "rabi"],
        "tip": "Sensitive to frost and waterlogging. Use drip irrigation.",
        "soil_type": "Sandy loam"
    },
    {
        "name": "Garlic", "emoji": "🧄",
        "temp_min": 12, "temp_max": 24, "humidity_min": 55,
        "season": ["rabi"],
        "tip": "Plant in cool weather. Avoid excessive nitrogen.",
        "soil_type": "Well-drained sandy loam"
    },
    {
        "name": "Cucumber", "emoji": "🥒",
        "temp_min": 18, "temp_max": 32, "humidity_min": 50,
        "season": ["kharif", "summer"],
        "tip": "Trellis for better yield and disease control.",
        "soil_type": "Sandy loam with good drainage"
    },
]

def get_current_season() -> str:
    """Determine Indian agricultural season from current month."""
    month = datetime.now().month
    if month in [6, 7, 8, 9]:
        return "kharif"
    elif month in [10, 11, 12, 1, 2]:
        return "rabi"
    else:
        return "summer"

def estimate_soil_conditions(temp: float, humidity: int, pressure: int, clouds: int) -> dict:
    """
    Estimate soil conditions from weather data.
    These are heuristic estimates — for a real app, use a soil sensor API.
    """
    # Soil moisture estimation (heuristic)
    if humidity > 80:
        soil_moisture = min(95, 50 + (humidity - 50) * 0.8)
        moisture_level = "High"
        moisture_color = "blue"
    elif humidity > 60:
        soil_moisture = 40 + (humidity - 60) * 0.5
        moisture_level = "Moderate"
        moisture_color = "green"
    elif humidity > 40:
        soil_moisture = 20 + (humidity - 40) * 0.5
        moisture_level = "Low"
        moisture_color = "amber"
    else:
        soil_moisture = max(5, humidity * 0.3)
        moisture_level = "Critical"
        moisture_color = "red"

    # Soil temperature estimate (slightly below air temp)
    soil_temp = round(temp * 0.85 + 2, 1)

    # pH estimation based on region/rainfall heuristic
    if humidity > 75:
        ph = 6.0  # wet regions tend to be more acidic
        ph_label = "Slightly Acidic (6.0)"
    elif humidity < 45:
        ph = 7.8  # dry regions tend to be alkaline
        ph_label = "Slightly Alkaline (7.8)"
    else:
        ph = 6.8
        ph_label = "Near Neutral (6.8)"

    # Nitrogen indicator (heuristic — post-rain tends to leach nitrogen)
    if humidity > 80 and clouds > 60:
        nitrogen = "Low (Leaching Risk)"
        nitrogen_pct = 25
    elif temp > 32:
        nitrogen = "Moderate"
        nitrogen_pct = 55
    else:
        nitrogen = "Good"
        nitrogen_pct = 70

    return {
        "moisture_pct": round(soil_moisture, 1),
        "moisture_level": moisture_level,
        "moisture_color": moisture_color,
        "soil_temp": soil_temp,
        "ph": ph,
        "ph_label": ph_label,
        "nitrogen": nitrogen,
        "nitrogen_pct": nitrogen_pct,
        "note": "Estimates based on live weather data. For precise readings, use a soil sensor."
    }

def get_crop_recommendations(temp: float, humidity: int) -> list:
    """Return list of recommended crops sorted by suitability."""
    season = get_current_season()
    recommendations = []

    for crop in CROP_DATABASE:
        if season not in crop["season"]:
            continue
        if crop["temp_min"] <= temp <= crop["temp_max"] and humidity >= crop["humidity_min"]:
            score = 100 - abs(temp - (crop["temp_min"] + crop["temp_max"]) / 2) * 2
            recommendations.append({**crop, "score": round(min(100, max(0, score)))})

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:6]

def get_farming_alerts(temp: float, humidity: int, wind_speed: float, description: str) -> list:
    """Generate contextual farming alerts based on weather conditions."""
    alerts = []

    if humidity > 85:
        alerts.append({
            "type": "danger",
            "icon": "⚠️",
            "title": "High Fungal Risk",
            "message": f"Humidity at {humidity}% — perfect conditions for Late Blight & Leaf Mold. Spray preventive fungicide immediately."
        })
    elif humidity > 75:
        alerts.append({
            "type": "warning",
            "icon": "🍄",
            "title": "Elevated Disease Pressure",
            "message": f"Humidity at {humidity}% — monitor crops closely. Consider prophylactic copper spray."
        })

    if temp > 38:
        alerts.append({
            "type": "danger",
            "icon": "🔥",
            "title": "Extreme Heat Stress",
            "message": f"Temperature at {temp}°C — water crops early morning (5–7 AM) and late evening (6–8 PM). Mulch soil to retain moisture."
        })
    elif temp > 33:
        alerts.append({
            "type": "warning",
            "icon": "☀️",
            "title": "High Temperature",
            "message": f"At {temp}°C, increase irrigation frequency. Avoid midday watering — maximises evaporation losses."
        })
    elif temp < 12:
        alerts.append({
            "type": "warning",
            "icon": "❄️",
            "title": "Cold Stress Risk",
            "message": f"Temperature at {temp}°C — protect sensitive crops with frost covers. Avoid overhead irrigation at night."
        })

    if wind_speed > 40:
        alerts.append({
            "type": "danger",
            "icon": "💨",
            "title": "High Wind Warning",
            "message": f"Wind at {wind_speed} km/h — do NOT spray today. Stake tall plants (tomato, corn) to prevent lodging."
        })
    elif wind_speed > 25:
        alerts.append({
            "type": "warning",
            "icon": "🌬️",
            "title": "Avoid Spraying",
            "message": f"Wind at {wind_speed} km/h — spray drift risk is high. Schedule pesticide applications for calm morning hours."
        })

    if "rain" in description.lower() or "storm" in description.lower():
        alerts.append({
            "type": "info",
            "icon": "🌧️",
            "title": "Rain Detected",
            "message": "Delay fertilizer application — rain will wash nutrients away. Post-rain is a good time to apply organic mulch."
        })

    if not alerts:
        alerts.append({
            "type": "success",
            "icon": "✅",
            "title": "Good Farming Conditions",
            "message": "Weather is stable and suitable for standard farming activities including spraying, fertilizing, and harvesting."
        })

    return alerts

def get_irrigation_schedule(temp: float, humidity: int) -> dict:
    """Recommend irrigation timing based on weather."""
    if temp > 35:
        return {
            "morning": "5:00 AM – 7:00 AM",
            "evening": "6:30 PM – 8:00 PM",
            "frequency": "Twice daily",
            "reason": "High temperatures increase evapotranspiration rapidly."
        }
    elif humidity > 75:
        return {
            "morning": "6:00 AM – 8:00 AM",
            "evening": "Skip if soil is already moist",
            "frequency": "Once daily or as needed",
            "reason": "High humidity means soil retains moisture longer."
        }
    else:
        return {
            "morning": "6:30 AM – 8:30 AM",
            "evening": "5:30 PM – 7:00 PM",
            "frequency": "Once daily",
            "reason": "Moderate conditions — standard irrigation protocol."
        }
