import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import pest, crop, irrigation, market
from db.database import init_db_pool, close_db_pool, init_db
from config import settings

# Configure logging format and level
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("krushiai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting up KrushiAI API...")
    try:
        init_db_pool()
        init_db()
    except Exception as e:
        logger.critical(f"Failed to initialize database during startup: {e}")
        raise e
    yield
    # Shutdown actions
    logger.info("Shutting down KrushiAI API...")
    close_db_pool()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS middleware configured via settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for uniform API error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": {
                "message": "Internal server error. Please try again later.",
                "code": 500
            }
        }
    )

app.include_router(pest.router, prefix="/pest", tags=["Pest Detection"])
app.include_router(crop.router, prefix="/crop", tags=["Crop Advisor"])
app.include_router(irrigation.router, prefix="/irrigation", tags=["Irrigation Advisor"])
app.include_router(market.router, prefix="/market", tags=["Market Price Predictor"])

@app.get("/")
def health_check():
    return {"status": "KrushiAI backend running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT)