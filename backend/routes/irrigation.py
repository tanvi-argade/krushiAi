import json, os, math, requests
from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.eto_calculator import (calculate_eto, get_kc_for_stage,
                                   calculate_irrigation_depth)
from db.database import save_query

router = APIRouter(tags=["irrigation"])

# Load data files on startup
BASE = os.path.dirname(os.path.dirname(__file__))
with open(os.path.join(BASE, 'data', 'crop_kc_values.json')) as f:
    KC_VALUES = json.load(f)
with open(os.path.join(BASE, 'data', 'soil_water_properties.json')) as f:
    SOIL_PROPS = json.load(f)

class IrrigationRequest(BaseModel):
    crop: str
    location: str
    sowing_date: str        # format: YYYY-MM-DD
    soil_type: str
    land_size_acres: float = 1.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

def get_coordinates(location: str):
    """
    Get lat/lon for Indian location using 
    Open-Meteo geocoding API (free, no key)
    """
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": location, "count": 1, "language": "en", "format": "json"}
    try:
        r = requests.get(url, params=params, timeout=5)
        data = r.json()
        if data.get("results"):
            result = data["results"][0]
            return result["latitude"], result["longitude"], result.get("elevation", 100)
    except:
        pass
    return 20.5937, 78.9629, 100  # India center fallback

def get_weather_forecast(lat, lon):
    """
    Fetch 7-day weather forecast from Open-Meteo API
    Completely free, no API key required
    Variables: temperature, humidity, wind, solar radiation, rainfall
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min", 
            "relative_humidity_2m_max",
            "wind_speed_10m_max",
            "shortwave_radiation_sum",
            "precipitation_sum"
        ],
        "timezone": "Asia/Kolkata",
        "forecast_days": 7
    }
    try:
        r = requests.get(url, params=params, timeout=10)
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=503, 
            detail=f"Weather API unavailable: {str(e)}")

@router.post("/schedule")
async def get_irrigation_schedule(req: IrrigationRequest):
    
    # Get coordinates
    if req.latitude and req.longitude:
        lat, lon, elevation = req.latitude, req.longitude, 100
    else:
        lat, lon, elevation = get_coordinates(req.location)
    
    # Get real 7-day weather from Open-Meteo
    weather = get_weather_forecast(lat, lon)
    daily = weather.get("daily", {})
    
    # Get crop Kc values (use default if crop not found)
    crop_key = req.crop.lower().replace(" ", "")
    crop_kc = KC_VALUES.get(crop_key) or KC_VALUES.get(req.crop.lower()) or KC_VALUES["default"]
    
    # Get soil properties
    soil_key = req.soil_type.lower()
    soil_props = SOIL_PROPS.get(soil_key) or SOIL_PROPS["default"]
    
    # Parse sowing date
    try:
        sowing = datetime.strptime(req.sowing_date, "%Y-%m-%d").date()
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Build 7-day irrigation schedule
    schedule = []
    dates = daily.get("time", [])
    
    for i, date_str in enumerate(dates):
        current_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        days_since_sowing = (current_date - sowing).days
        doy = current_date.timetuple().tm_yday
        
        # Get weather values for this day
        tmax = daily["temperature_2m_max"][i]
        tmin = daily["temperature_2m_min"][i]
        humidity = daily["relative_humidity_2m_max"][i]
        wind = daily["wind_speed_10m_max"][i] / 3.6  # km/h to m/s
        solar = daily["shortwave_radiation_sum"][i] / 1000 * 11.57 # Wh/m2 to MJ/m2
        rainfall = daily["precipitation_sum"][i]
        
        # Calculate ETo using Penman-Monteith
        eto = calculate_eto(tmax, tmin, humidity, wind, 
                           solar, elevation, doy)
        
        # Get Kc for current growth stage
        kc, stage = get_kc_for_stage(crop_kc, days_since_sowing)
        
        # Calculate irrigation requirement
        irr = calculate_irrigation_depth(
            eto, kc, rainfall, soil_props, crop_kc["root_depth_m"])
        
        # Convert mm to liters per acre
        liters_per_acre = irr["net_irrigation_required_mm"] * 4046.86
        
        schedule.append({
            "date": date_str,
            "day_of_crop": max(0, days_since_sowing),
            "growth_stage": stage,
            "weather": {
                "tmax": tmax, "tmin": tmin,
                "humidity": humidity,
                "rainfall_mm": rainfall,
                "wind_speed_ms": round(wind, 2),
                "solar_radiation_mj": round(solar, 2)
            },
            "calculation": {
                "eto_mm": eto,
                "kc": kc,
                "etc_mm": irr["etc_mm"],
                "effective_rainfall_mm": irr["effective_rainfall_mm"],
                "net_irrigation_mm": irr["net_irrigation_required_mm"],
            },
            "recommendation": {
                "irrigate": irr["irrigation_needed"],
                "amount_mm": irr["net_irrigation_required_mm"],
                "amount_liters_per_acre": round(liters_per_acre, 0),
                "best_time": "Early morning (6-8 AM) or Evening (6-8 PM)",
                "message": (
                    f"Irrigate {irr['net_irrigation_required_mm']:.1f} mm "
                    f"({liters_per_acre:,.0f} L/acre) — {stage} stage"
                    if irr["irrigation_needed"]
                    else f"No irrigation needed — {rainfall:.1f}mm rain covers crop demand"
                )
            }
        })
    
    # Summary stats
    total_irrigation = sum(d["recommendation"]["amount_mm"] for d in schedule)
    irrigation_days = sum(1 for d in schedule if d["recommendation"]["irrigate"])
    
    response = {
        "crop": req.crop,
        "location": req.location,
        "coordinates": {"lat": lat, "lon": lon},
        "soil_type": req.soil_type,
        "sowing_date": req.sowing_date,
        "land_size_acres": req.land_size_acres,
        "current_growth_stage": schedule[0]["growth_stage"] if schedule else "unknown",
        "7_day_summary": {
            "total_irrigation_needed_mm": round(total_irrigation, 1),
            "total_irrigation_liters_per_acre": round(total_irrigation * 4046.86, 0),
            "days_requiring_irrigation": irrigation_days,
            "days_with_sufficient_rain": 7 - irrigation_days
        },
        "daily_schedule": schedule
    }
    
    save_query("irrigation", req.dict(), response)
    return response
