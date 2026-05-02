from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import torch
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
import io
import json
import os
from db.database import save_query, get_history

router = APIRouter()

# Load model and extractor once at startup
MODEL_PATH = "./models/pest_model"
try:
    print(f"Loading model from {MODEL_PATH}...")
    extractor = AutoFeatureExtractor.from_pretrained(MODEL_PATH)
    model = AutoModelForImageClassification.from_pretrained(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    extractor = None
    model = None

# Load treatments data
TREATMENTS_PATH = "./data/treatments.json"
try:
    with open(TREATMENTS_PATH, "r") as f:
        treatments_data = json.load(f)
except Exception as e:
    print(f"Error loading treatments.json: {e}")
    treatments_data = {}

@router.post("/detect")
async def detect_pest(file: UploadFile = File(...)):
    if not model or not extractor:
        raise HTTPException(status_code=500, detail="Pest detection model not loaded.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Inference
        inputs = extractor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            
        # Get prediction
        predicted_class_idx = logits.argmax(-1).item()
        labels = model.config.id2label
        raw_label = labels[predicted_class_idx]
        confidence = torch.nn.functional.softmax(logits, dim=-1)[0][predicted_class_idx].item()
        
        # Lookup treatment
        treatment_info = treatments_data.get(raw_label, {
            "display_name": raw_label.replace("___", " ").replace("_", " "),
            "severity": "Unknown",
            "treatment": "Consult a local agricultural expert.",
            "prevention": "Maintain general plant hygiene."
        })
        
        response = {
            "disease": treatment_info.get("display_name"),
            "confidence": round(confidence, 4),
            "severity": treatment_info.get("severity"),
            "treatment": treatment_info.get("treatment"),
            "prevention": treatment_info.get("prevention"),
            "raw_label": raw_label
        }
        
        # Save to DB
        save_query("pest", {"filename": file.filename}, response)
        
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during detection: {str(e)}")

@router.get("/history")
async def pest_history():
    try:
        history = get_history(limit=10)
        # Filter for pest module only
        pest_history = [h for h in history if h["module"] == "pest"]
        return pest_history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")
