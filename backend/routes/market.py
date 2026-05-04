import json, os, pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.database import save_query

router = APIRouter(tags=["market"])

BASE = os.path.dirname(os.path.dirname(__file__))

# Load all model artifacts on startup
try:
    with open(f'{BASE}/models/market_model.pkl', 'rb') as f:
        market_model = pickle.load(f)
    with open(f'{BASE}/models/market_le_crop.pkl', 'rb') as f:
        le_crop = pickle.load(f)
    with open(f'{BASE}/models/market_le_state.pkl', 'rb') as f:
        le_state = pickle.load(f)
    with open(f'{BASE}/models/market_metadata.json', 'r') as f:
        market_meta = json.load(f)
    print("Market model loaded successfully.")
except Exception as e:
    print(f"Market model load error: {e}")
    market_model = None

class MarketRequest(BaseModel):
    crop: str
    state: str
    harvest_date: Optional[str] = None  # YYYY-MM-DD, defaults to today

def predict_price_for_date(crop: str, state: str, target_date: datetime):
    crop_clean = crop.lower().strip()
    state_clean = state.lower().strip()

    if crop_clean not in le_crop.classes_:
        raise HTTPException(
            status_code=400,
            detail=f"Crop '{crop}' not in training data. "
                   f"Available: {le_crop.classes_[:10].tolist()}"
        )
    if state_clean not in le_state.classes_:
        raise HTTPException(
            status_code=400,
            detail=f"State '{state}' not in training data. "
                   f"Available: {le_state.classes_[:10].tolist()}"
        )

    crop_enc = le_crop.transform([crop_clean])[0]
    state_enc = le_state.transform([state_clean])[0]

    features = [[
        crop_enc,
        state_enc,
        target_date.month,
        target_date.year,
        target_date.timetuple().tm_yday,
        (target_date.month - 1) // 3 + 1
    ]]
    price = market_model.predict(features)[0]
    return round(float(price), 2)

@router.post("/predict")
async def predict_market_price(req: MarketRequest):
    if market_model is None:
        raise HTTPException(status_code=500,
            detail="Market model not loaded.")

    # Base date
    if req.harvest_date:
        try:
            base_date = datetime.strptime(req.harvest_date, "%Y-%m-%d")
        except:
            raise HTTPException(status_code=400,
                detail="Invalid date. Use YYYY-MM-DD")
    else:
        base_date = datetime.now()

    # Predict prices for next 30 days
    predictions = []
    for i in range(30):
        target = base_date + timedelta(days=i)
        price = predict_price_for_date(req.crop, req.state, target)
        predictions.append({
            "date": target.strftime("%Y-%m-%d"),
            "day": i + 1,
            "predicted_price_per_quintal": price,
            "predicted_price_per_kg": round(price / 100, 2)
        })

    # Find best day to sell (highest price in next 30 days)
    best = max(predictions, key=lambda x: x["predicted_price_per_quintal"])
    worst = min(predictions, key=lambda x: x["predicted_price_per_quintal"])
    avg_price = round(
        sum(p["predicted_price_per_quintal"] for p in predictions) / 30, 2)

    # Price trend (up/down/stable)
    first_week_avg = sum(
        p["predicted_price_per_quintal"] for p in predictions[:7]) / 7
    last_week_avg = sum(
        p["predicted_price_per_quintal"] for p in predictions[-7:]) / 7
    if last_week_avg > first_week_avg * 1.03:
        trend = "rising"
        trend_advice = "Prices are rising. Consider storing and selling later."
    elif last_week_avg < first_week_avg * 0.97:
        trend = "falling"
        trend_advice = "Prices are falling. Consider selling sooner."
    else:
        trend = "stable"
        trend_advice = "Prices are stable. Sell when convenient."

    response = {
        "crop": req.crop,
        "state": req.state,
        "model_accuracy": {
            "mae_inr_per_quintal": market_meta.get("mae"),
            "r2_score": market_meta.get("r2")
        },
        "summary": {
            "best_day_to_sell": best["date"],
            "best_price_per_quintal": best["predicted_price_per_quintal"],
            "best_price_per_kg": best["predicted_price_per_kg"],
            "worst_day": worst["date"],
            "worst_price": worst["predicted_price_per_quintal"],
            "average_price_30d": avg_price,
            "price_trend": trend,
            "advice": trend_advice
        },
        "30_day_forecast": predictions
    }

    save_query("market", req.dict(), response)
    return response

@router.get("/crops")
async def get_available_crops():
    if market_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")
    return {"crops": sorted(market_meta.get("crops", []))}

@router.get("/states")
async def get_available_states():
    if market_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")
    return {"states": sorted(market_meta.get("states", []))}
