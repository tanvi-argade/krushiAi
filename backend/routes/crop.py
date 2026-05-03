from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
import pickle
import numpy as np
from typing import List, Optional
from db.database import save_query

router = APIRouter()

# Load crop data on module startup
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "crop_soil_map.json")
try:
    with open(DATA_PATH, "r") as f:
        CROP_DATA = json.load(f)["crops"]
except Exception as e:
    print(f"Error loading crop data: {e}")
    CROP_DATA = []

# Load ML model and label encoder
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "crop_model.pkl")
LE_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "crop_label_encoder.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        crop_model = pickle.load(f)
    with open(LE_PATH, "rb") as f:
        crop_le = pickle.load(f)
except Exception as e:
    print(f"Error loading ML model: {e}")
    crop_model = None
    crop_le = None

class RecommendationRequest(BaseModel):
    soil_type: str
    location: str
    land_size: float
    water_availability: str
    season: str
    N: Optional[float] = None
    P: Optional[float] = None
    K: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ph: Optional[float] = None
    rainfall: Optional[float] = None

@router.post("/recommend")
async def recommend_crop(request: RecommendationRequest):
    # Determine which logic to use
    ml_params = [request.N, request.P, request.K, request.temperature, request.humidity, request.ph, request.rainfall]
    use_ml = all(p is not None for p in ml_params) and crop_model is not None

    recommendations = []
    ml_used = False

    if use_ml:
        # ML Logic
        features = [ml_params]
        proba = crop_model.predict_proba(features)[0]
        top3_indices = proba.argsort()[-3:][::-1]
        top3_results = [(crop_le.classes_[i], proba[i]) for i in top3_indices]
        
        for i, (crop_name, confidence) in enumerate(top3_results, 1):
            # Look up in JSON for metadata
            # Match name case-insensitively
            crop_meta = next((c for c in CROP_DATA if c["name"].lower() == crop_name.lower()), None)
            
            if crop_meta:
                total_profit_for_land = crop_meta["profit_per_acre_inr"] * request.land_size
                total_revenue_per_acre = crop_meta["yield_per_acre_kg"] * crop_meta["price_per_kg_inr"]
                
                recommendations.append({
                    "rank": i,
                    "crop": crop_meta["name"],
                    "season": crop_meta["season"],
                    "duration_days": crop_meta["duration_days"],
                    "yield_per_acre_kg": crop_meta["yield_per_acre_kg"],
                    "price_per_kg_inr": crop_meta["price_per_kg_inr"],
                    "expected_profit_per_acre": crop_meta["profit_per_acre_inr"],
                    "input_cost_per_acre": crop_meta["input_cost_per_acre_inr"],
                    "total_revenue_per_acre": total_revenue_per_acre,
                    "total_profit_for_land": total_profit_for_land,
                    "description": crop_meta["description"],
                    "match_reason": f"AI Predicted with {confidence:.1%} confidence",
                    "ml_used": True,
                    "confidence": float(confidence)
                })
        ml_used = True

    if not recommendations:
        # Fallback to Rule-based Logic
        soil_input = request.soil_type.lower()
        location_input = request.location.lower()
        water_input = request.water_availability.lower()
        season_input = request.season.lower()

        def filter_crops(relax_water=False):
            filtered = []
            for crop in CROP_DATA:
                soil_match = any(soil_input in s.lower() or s.lower() in soil_input for s in crop["suitable_soils"])
                location_match = any(location_input == s.lower() for s in crop["suitable_states"])
                if relax_water:
                    water_match = True
                else:
                    water_match = water_input == crop["water_requirement"].lower()
                season_match = (season_input == crop["season"].lower() or crop["season"].lower() == "both" or season_input == "both")
                
                if soil_match and location_match and water_match and season_match:
                    filtered.append(crop)
            return filtered

        results = filter_crops(relax_water=False)
        if not results:
            results = filter_crops(relax_water=True)
        if not results:
            results = sorted(CROP_DATA, key=lambda x: x["profit_per_acre_inr"], reverse=True)[:3]
            match_reason_base = "Top profitable crops (No exact match)"
        else:
            match_reason_base = f"Matches {request.soil_type} soil, {request.location} location"

        results = sorted(results, key=lambda x: x["profit_per_acre_inr"], reverse=True)
        for i, crop in enumerate(results[:3], 1):
            total_profit_for_land = crop["profit_per_acre_inr"] * request.land_size
            total_revenue_per_acre = crop["yield_per_acre_kg"] * crop["price_per_kg_inr"]
            recommendations.append({
                "rank": i,
                "crop": crop["name"],
                "season": crop["season"],
                "duration_days": crop["duration_days"],
                "yield_per_acre_kg": crop["yield_per_acre_kg"],
                "price_per_kg_inr": crop["price_per_kg_inr"],
                "expected_profit_per_acre": crop["profit_per_acre_inr"],
                "input_cost_per_acre": crop["input_cost_per_acre_inr"],
                "total_revenue_per_acre": total_revenue_per_acre,
                "total_profit_for_land": total_profit_for_land,
                "description": crop["description"],
                "match_reason": match_reason_base,
                "ml_used": False,
                "confidence": None
            })
        ml_used = False

    response_data = {
        "recommendations": recommendations,
        "land_size": request.land_size,
        "soil_type": request.soil_type,
        "location": request.location,
        "season": request.season,
        "ml_used": ml_used,
        "total_profit_rank1": recommendations[0]["total_profit_for_land"] if recommendations else 0
    }

    save_query("crop_advisor", request.dict(), response_data)
    return response_data

@router.get("/soils")
async def get_soils():
    soils = set()
    for crop in CROP_DATA:
        for s in crop["suitable_soils"]:
            soils.add(s.title())
    return sorted(list(soils))

@router.get("/states")
async def get_states():
    states = set()
    for crop in CROP_DATA:
        for s in crop["suitable_states"]:
            states.add(s.title())
    return sorted(list(states))
