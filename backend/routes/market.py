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

market_model = None
le_crop = None
le_state = None
market_meta = {}
latest_prices = {}

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
    with open(f'{BASE}/models/market_latest_prices.pkl', 'rb') as f:
        latest_prices = pickle.load(f)
    print("Market model loaded successfully.")
except Exception as e:
    print(f"Market model load error: {e}")

class MarketRequest(BaseModel):
    crop: str
    state: str
    harvest_date: Optional[str] = None

def normalize_state(name):
    state_map = {
        "chattisgarh": "chhattisgarh", "tamilnadu": "tamil nadu",
        "jammu & kashmir": "jammu and kashmir", "gao": "goa", "uttrakhand": "uttarakhand"
    }
    name = name.lower().strip()
    return state_map.get(name, name)

def predict_price_for_date(crop_enc, state_enc, target_date, lags):
    if "feature_columns" not in market_meta:
        raise HTTPException(status_code=500, detail="Feature schema missing in metadata")
    
    day_of_year = target_date.timetuple().tm_yday
    sin_day = np.sin(2 * np.pi * day_of_year / 365.25)
    cos_day = np.cos(2 * np.pi * day_of_year / 365.25)
    
    features = [
        crop_enc,
        state_enc,
        target_date.year,
        sin_day,
        cos_day,
        lags['price_lag_1'],
        lags['price_lag_7'],
        lags['price_lag_30'],
        lags['rolling_mean_7']
    ]
    
    X = pd.DataFrame([features], columns=market_meta["feature_columns"])
    price = market_model.predict(X)[0]
    return round(float(price), 2)

@router.post("/predict")
async def predict_market_price(req: MarketRequest):
    if market_model is None:
        raise HTTPException(status_code=500, detail="Market model not loaded.")

    crop_clean = req.crop.lower().strip()
    state_clean = normalize_state(req.state)

    if crop_clean not in le_crop.classes_:
        raise HTTPException(status_code=400, detail=f"Crop '{req.crop}' not in data.")
    if state_clean not in le_state.classes_:
        raise HTTPException(status_code=400, detail=f"State '{req.state}' not in data.")

    crop_enc = le_crop.transform([crop_clean])[0]
    state_enc = le_state.transform([state_clean])[0]

    base_date = datetime.strptime(req.harvest_date, "%Y-%m-%d") if req.harvest_date else datetime.now()

    history = latest_prices.get(f"{crop_clean}_{state_clean}", [])
    if not history:
        current_lags = {'price_lag_1': 1500, 'price_lag_7': 1500, 'price_lag_30': 1500, 'rolling_mean_7': 1500}
    else:
        last = history[-1]
        current_lags = {
            'price_lag_1': last.get('modal_price', 1500),
            'price_lag_7': last.get('price_lag_7', last.get('modal_price', 1500)),
            'price_lag_30': last.get('price_lag_30', last.get('modal_price', 1500)),
            'rolling_mean_7': last.get('rolling_mean_7', last.get('modal_price', 1500))
        }

    predictions = []
    temp_history = [h['modal_price'] for h in history[-30:]] if history else [1500]*30
    
    for i in range(30):
        target = base_date + timedelta(days=i)
        
        p_lag_1 = temp_history[-1]
        p_lag_7 = temp_history[-7] if len(temp_history) >= 7 else temp_history[-1]
        p_lag_30 = temp_history[-30] if len(temp_history) >= 30 else temp_history[0]
        r_mean_7 = sum(temp_history[-7:]) / 7 if len(temp_history) >= 7 else temp_history[-1]
        
        lags = {'price_lag_1': p_lag_1, 'price_lag_7': p_lag_7, 'price_lag_30': p_lag_30, 'rolling_mean_7': r_mean_7}
        
        price = predict_price_for_date(crop_enc, state_enc, target, lags)
        predictions.append({
            "date": target.strftime("%Y-%m-%d"),
            "predicted_price_per_quintal": price,
            "predicted_price_per_kg": round(price / 100, 2)
        })
        temp_history.append(price)

    best = max(predictions, key=lambda x: x["predicted_price_per_quintal"])
    worst = min(predictions, key=lambda x: x["predicted_price_per_quintal"])
    avg_price = round(sum(p["predicted_price_per_quintal"] for p in predictions) / 30, 2)

    first_avg = sum(p["predicted_price_per_quintal"] for p in predictions[:7]) / 7
    last_avg = sum(p["predicted_price_per_quintal"] for p in predictions[-7:]) / 7
    trend = "rising" if last_avg > first_avg * 1.03 else ("falling" if last_avg < first_avg * 0.97 else "stable")

    r2 = market_meta.get("r2_score", 0)
    if r2 < 0.4:
        confidence = "low"
    elif r2 < 0.65:
        confidence = "medium"
    else:
        confidence = "high"
    
    if confidence == "low":
        advice = "Low confidence prediction. Use only as directional guidance."
    elif confidence == "medium":
        advice = "Moderate confidence. Consider local market conditions."
    else:
        advice = "Prices are rising. Consider storing and selling later." if trend == "rising" else \
                 ("Prices are falling. Consider selling sooner." if trend == "falling" else "Prices are stable. Sell when convenient.")

    summary = {
        "best_day_to_sell": best["date"],
        "best_price_per_quintal": best["predicted_price_per_quintal"],
        "best_price_per_kg": best["predicted_price_per_kg"],
        "worst_day": worst["date"],
        "worst_price": worst["predicted_price_per_quintal"],
        "average_price_30d": avg_price,
        "price_trend": trend,
        "confidence": confidence,
        "advice": advice
    }

    response = {
        "crop": req.crop,
        "state": req.state,
        "summary": summary,
        "model_accuracy": {
            "mae_inr_per_quintal": market_meta.get("mae"),
            "r2_score": r2
        },
        "30_day_forecast": predictions
    }

    save_query("market", req.dict(), response)
    return response

@router.get("/crops")
async def get_available_crops():
    if not market_meta: raise HTTPException(status_code=500, detail="Market metadata not loaded.")
    return {"crops": sorted(market_meta.get("crops", []))}

@router.get("/states")
async def get_available_states():
    if not market_meta: raise HTTPException(status_code=500, detail="Market metadata not loaded.")
    return {"states": sorted(market_meta.get("states", []))}
