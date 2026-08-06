import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "KrushiAI API"
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "krushiai")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins_str = os.getenv("ALLOWED_ORIGINS", "*")
        return [o.strip() for o in origins_str.split(",") if o.strip()]

    PORT: int = int(os.getenv("PORT", 8000))

settings = Settings()
