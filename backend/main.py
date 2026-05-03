from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import pest, crop, irrigation
from db.database import init_db

app = FastAPI(title="KrushiAI API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(pest.router, prefix="/pest", tags=["Pest Detection"])
app.include_router(crop.router, prefix="/crop", tags=["Crop Advisor"])
app.include_router(irrigation.router, prefix="/irrigation", tags=["Irrigation Advisor"])

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def health_check():
    return {"status": "KrushiAI backend running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
