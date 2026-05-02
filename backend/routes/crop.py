from fastapi import APIRouter
from pydantic import BaseModel
from db.database import save_query

router = APIRouter()

class CropRequest(BaseModel):
    soil_type: str
    location: str
    land_size: float
    water_availability: str

@router.post("/recommend")
async def recommend_crop(request: CropRequest):
    # Mock response
    response = {
        "suggestions": [
            {"crop": "Tomato", "suitability": 0.95, "reason": "Rich in organic matter and good drainage."},
            {"crop": "Chillies", "suitability": 0.88, "reason": "Suitable temperature and soil pH."},
            {"crop": "Brinjal", "suitability": 0.82, "reason": "Well-suited for the clay loam soil."}
        ]
    }
    save_query("crop", request.dict(), response)
    return response
