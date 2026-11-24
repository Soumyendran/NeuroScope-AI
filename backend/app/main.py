
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.app.api.datasets import router as datasets_router


# Application metadata
APP_NAME = "NeuroScope AI"
APP_VERSION = "0.1.0"

# Initialize FastAPI
app = FastAPI(
    title=APP_NAME,
    description="An intelligent machine learning and data science platform.",
    version=APP_VERSION,
)
app.include_router(datasets_router)

# Allow local React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health response schema
class HealthResponse(BaseModel):
    status: str
    application: str
    version: str
    timestamp: str


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to NeuroScope AI",
        "description": "Intelligent Data Science and Machine Learning Platform",
        "version": APP_VERSION,
        "documentation": "/docs",
    }


# Health check endpoint
@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        application=APP_NAME,
        version=APP_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
