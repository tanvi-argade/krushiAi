import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import pest, crop, irrigation, market
from db.database import init_db

app = FastAPI(title="KrushiAI API")

# 🔥 FIX: production-safe CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pest.router, prefix="/pest", tags=["Pest Detection"])
app.include_router(crop.router, prefix="/crop", tags=["Crop Advisor"])
app.include_router(irrigation.router, prefix="/irrigation", tags=["Irrigation Advisor"])
app.include_router(market.router, prefix="/market", tags=["Market Price Predictor"])

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def health_check():
    return {"status": "KrushiAI backend running"}

# 🔥 FIX: Render entry point
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)