from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import torch
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
import io
import json
import os
import numpy as np
from db.database import save_query, get_history

import logging

router = APIRouter()
logger = logging.getLogger("krushiai.pest")

# Load model and extractor once at startup
MODEL_PATH = "./models/pest_model"
try:
    logger.info(f"Loading model from {MODEL_PATH}...")
    extractor = AutoFeatureExtractor.from_pretrained(MODEL_PATH)
    model = AutoModelForImageClassification.from_pretrained(MODEL_PATH)
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.error(f"Error loading model: {e}", exc_info=True)
    extractor = None
    model = None

# Load treatments data
TREATMENTS_PATH = "./data/treatments.json"
try:
    with open(TREATMENTS_PATH, "r") as f:
        treatments_data = json.load(f)
except Exception as e:
    logger.error(f"Error loading treatments.json: {e}", exc_info=True)
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
        
        # Check image content (reject flat colors)
        img_array = np.array(image)
        if img_array.std() < 15:
            return {
                "disease": "Not a plant image",
                "confidence": 0.0,
                "severity": "None", 
                "treatment": "This does not appear to be a plant leaf. Please upload a real crop leaf photo.",
                "prevention": "Tips: Fill the frame with the leaf. Use good lighting.",
                "raw_label": "unrecognized"
            }

        # Inference
        inputs = extractor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            
        # Get prediction
        predicted_class_idx = logits.argmax(-1).item()
        raw_label = model.config.id2label[predicted_class_idx]
        confidence = torch.nn.functional.softmax(logits, dim=-1)[0][predicted_class_idx].item()
        
        # Stronger confidence check for non-plant images
        if confidence < 0.40:
            return {
                "disease": "Not a plant image",
                "confidence": float(round(confidence, 4)),
                "severity": "None",
                "treatment": "This does not appear to be a plant leaf image. Please upload a clear photo of a crop leaf.",
                "prevention": "Tips: Fill the frame with the leaf. Use good lighting. Avoid blurry images.",
                "raw_label": "unrecognized"
            }

        # FIX 3: Structured Fallback
        treatment_info = treatments_data.get(raw_label, {
            "display_name": raw_label.replace("_", " ").replace("  ", " "),
            "severity": "Medium",
            "treatment": "Apply broad-spectrum fungicide. Remove visibly infected leaves.",
            "prevention": "Maintain proper plant spacing and avoid waterlogging."
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
        rows = get_history(module="pest", limit=10)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")
