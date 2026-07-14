"""
main.py — YieldSmart FastAPI backend (v2 — with auth + history)
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import init_db, save_scan, get_history, get_scan_stats
from auth import (
    create_user, authenticate_user, create_access_token,
    get_current_user, get_optional_user
)
from weather_service import get_current_weather, get_forecast
from soil_service import (
    estimate_soil_conditions, get_crop_recommendations,
    get_farming_alerts, get_irrigation_schedule, get_current_season
)


# Init DB on startup
init_db()

app = FastAPI(
    title="YieldSmart API v2",
    description="Smart Farming Platform — Auth, Weather, Soil Intelligence & AI Disease Detection",
    version="2.0.0"
)

# CORS origins configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ───────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    city: str

class SignInRequest(BaseModel):
    email: str
    password: str

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "YieldSmart API v2"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "season": get_current_season(), "version": "2.0.0"}

# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.post("/api/auth/signup")
def signup(body: SignUpRequest):
    """Register a new farmer account."""
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if len(body.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name.")
    if len(body.city.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid city.")

    user = create_user(
        name=body.name.strip(),
        email=body.email.strip(),
        password=body.password,
        city=body.city.strip()
    )
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": user}

@app.post("/api/auth/signin")
def signin(body: SignInRequest):
    """Sign in with email + password."""
    user = authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": user}

@app.get("/api/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user profile."""
    stats = get_scan_stats(current_user["id"])
    return {**current_user, **stats}

# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
def dashboard(
    city: str = Query(...),
    current_user: dict = Depends(get_optional_user)
):
    """Full dashboard data. Auth optional — works for guests too."""
    try:
        weather  = get_current_weather(city)
        temp     = weather["temp"]
        humidity = weather["humidity"]
        wind     = weather["wind_speed"]
        desc     = weather["description"]
        pressure = weather["pressure"]
        clouds   = weather["clouds"]

        soil      = estimate_soil_conditions(temp, humidity, pressure, clouds)
        crops     = get_crop_recommendations(temp, humidity)
        alerts    = get_farming_alerts(temp, humidity, wind, desc)
        irrigation = get_irrigation_schedule(temp, humidity)
        forecast  = get_forecast(city)

        return {
            "weather": weather, "soil": soil, "crops": crops,
            "alerts": alerts, "irrigation": irrigation,
            "forecast": forecast, "season": get_current_season()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Disease Detection ─────────────────────────────────────────────────────────

@app.post("/api/detect-disease")
async def detect_disease(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_optional_user)
):
    """Detect plant disease. If authenticated, saves to history."""
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Please upload a JPG or PNG image.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB).")

    try:
        from model_service import predict_disease
        result = predict_disease(contents)

        # Save to history if user is authenticated
        if current_user:
            info = result["disease_info"]
            save_scan(
                user_id=current_user["id"],
                plant=info.get("plant", "Unknown"),
                disease=info.get("display", result["label"]),
                severity=info.get("severity", "unknown"),
                confidence=result["confidence"],
                result_json=json.dumps(result)
            )

        return JSONResponse(content=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ── History ───────────────────────────────────────────────────────────────────

@app.get("/api/history")
def scan_history(
    limit: int = Query(default=20, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get authenticated user's scan history."""
    history = get_history(current_user["id"], limit=limit)
    stats   = get_scan_stats(current_user["id"])
    return {"history": history, "stats": stats}

# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
