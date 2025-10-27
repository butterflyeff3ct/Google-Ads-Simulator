"""
Search Campaign Simulator - Main FastAPI Application
"""
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Try to load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Using system environment variables.")
    print("Install with: pip install python-dotenv")
    # Continue without dotenv - will use system env vars

# Create FastAPI app
app = FastAPI(
    title="Search Campaign Simulator API",
    description="Educational platform for simulating search ad auctions",
    version="1.0.0"
)

# Database initialization
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        from app.database import initialize_database, test_connection
        print("Initializing database...")
        if initialize_database():
            print("✅ Database initialized successfully")
            if test_connection():
                print("✅ Database connection verified")
            else:
                print("⚠️ Database connection test failed")
        else:
            print("❌ Database initialization failed")
    except Exception as e:
        print(f"❌ Database initialization error: {str(e)}")
        print("Application will continue without database features")

# Configure CORS (update origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers for campaign wizard
from app.api import simulate, keywords, ai_max, auth, simple_auth, access_requests, user_management, unified_user_tracking, enhanced_simulate, cached_simulate, enhanced_visualization

# Register routes (campaign wizard only)
app.include_router(simulate.router, prefix="/api", tags=["Simulation"])
app.include_router(enhanced_simulate.router, prefix="/api", tags=["Enhanced Simulation"])
app.include_router(cached_simulate.router, prefix="/api", tags=["Cached Simulation"])
app.include_router(enhanced_visualization.router, prefix="/api", tags=["Enhanced Visualization"])
app.include_router(keywords.router, prefix="/api", tags=["Keywords"])
app.include_router(ai_max.router, prefix="/api", tags=["AI Max"])
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(simple_auth.router, prefix="/api", tags=["Simple Auth"])
app.include_router(access_requests.router, prefix="/api", tags=["Access Requests"])
app.include_router(user_management.router, prefix="/api", tags=["User Management"])
app.include_router(unified_user_tracking.router, prefix="/api", tags=["Unified User Tracking"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Search Campaign Simulator API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "cache": "active",
        "simulator": "ready"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
