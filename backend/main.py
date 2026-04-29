import logging
import sys
import os

# Ensure backend directory is on the path for relative imports
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from chat import router as chat_router
from rate_limiter import limiter
from dotenv import load_dotenv

# Load .env from project root (works whether run from backend/ or root)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))  # fallback

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="PersonaForge API")

# Rate limiting setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Serve frontend — resolve path relative to this file so it works from any cwd
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=os.path.abspath(frontend_dir), html=True), name="frontend")
