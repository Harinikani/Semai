# =============================================================================
# FILE: main.py
# DESCRIPTION: FastAPI application entry point with auto-seeding
# =============================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from relationships import setup_relationships

# Import routers
from routes import auth, users, species, friendships, reports, scanned_species, vouchers, points, badges, quiz

# Create database tables
Base.metadata.create_all(bind=engine)

# Setup relationships after all models are defined
setup_relationships()

# Create FastAPI application instance
app = FastAPI(
    title="Semai - Malaysia Wildlife Conservation API",
    description="A comprehensive API for wildlife conservation, species identification, and educational content",
    version="2.0.0"
)

# Configure CORS middleware - FIXED VERSION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # All common development origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  # Important for cookies/auth
)

# Include all API routers
app.include_router(auth.router)           # Authentication endpoints
app.include_router(users.router)          # User management endpoints  
app.include_router(species.router)        # Wildlife catalog endpoints
app.include_router(friendships.router)    # Social features endpoints
app.include_router(reports.router)        # Reporting system endpoints
app.include_router(scanned_species.router) # Species scanning endpoints
app.include_router(vouchers.router)       # Reward system endpoints
app.include_router(points.router)         # Points system endpoints
app.include_router(badges.router)         # Badges system endpoints
app.include_router(quiz.router)           # Educational quiz endpoints

# =============================================================================
# ROOT ENDPOINTS
# =============================================================================

@app.get("/")
async def root() -> dict:
    """
    Root endpoint - API welcome message
    
    Returns:
        dict: Welcome message and API information
    """
    return {
        "message": "Welcome to Semai - Malaysia Wildlife Conservation API",
        "version": "2.0.0",
        "status": "operational",
        "database": "Cloud SQL",
        "endpoints": {
            "documentation": "/docs",
            "health_check": "/health",
            "authentication": "/auth",
            "wildlife_catalog": "/api/wildlife"
        }
    }

@app.get("/health")
async def health_check() -> dict:
    """
    Health check endpoint for monitoring
    
    Returns:
        dict: API health status and timestamp
    """
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Semai API",
        "version": "2.0.0",
        "database": "Cloud SQL"
    }