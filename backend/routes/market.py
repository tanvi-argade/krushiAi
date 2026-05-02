from fastapi import APIRouter
from pydantic import BaseModel
from db.database import save_query

router = APIRouter()

class MarketRequest(BaseModel):
    crop: str
    region: str
    month: str

@router.post("/predict")
async def predict_market(request: MarketRequest):
    # Mock response
    response = {
        "predicted_price": 2500,
        "currency": "INR",
        "unit": "Quintal",
        "trend": "Upward",
        "confidence": 0.75
    }
    save_query("market", request.dict(), response)
    return response
