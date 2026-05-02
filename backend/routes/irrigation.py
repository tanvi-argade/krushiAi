from fastapi import APIRouter
from pydantic import BaseModel
from db.database import save_query

router = APIRouter()

class IrrigationRequest(BaseModel):
    crop: str
    location: str
    sowing_date: str

@router.post("/schedule")
async def schedule_irrigation(request: IrrigationRequest):
    # Mock response
    response = {
        "next_irrigation": "2024-05-05",
        "water_amount": "15 Liters/sqm",
        "frequency": "Every 3 days",
        "notes": "Rain expected on May 7, adjust accordingly."
    }
    save_query("irrigation", request.dict(), response)
    return response
