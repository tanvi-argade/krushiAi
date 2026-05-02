from fastapi import APIRouter, UploadFile, File
from db.database import save_query

router = APIRouter()

@router.post("/detect")
async def detect_pest(file: UploadFile = File(...)):
    # Mock response
    response = {
        "disease": "Early Blight",
        "confidence": 0.87,
        "treatment": "Apply mancozeb 2g/L. Avoid overhead irrigation."
    }
    save_query("pest", {"filename": file.filename}, response)
    return response
