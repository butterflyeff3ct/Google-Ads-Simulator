"""
Database Initialization Script
"""
import os
import sys
import logging
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import initialize_database, test_connection
from app.models import Base
from app.database import engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Initialize the database"""
    logger.info("Starting database initialization...")
    
    # Set environment variables if not set
    if not os.getenv("DB_SERVER"):
        os.environ["DB_SERVER"] = "localhost"
    if not os.getenv("DB_PORT"):
        os.environ["DB_PORT"] = "1433"
    if not os.getenv("DB_NAME"):
        os.environ["DB_NAME"] = "GoogleAdsSim"
    if not os.getenv("DB_USER"):
        os.environ["DB_USER"] = "sa"
    if not os.getenv("DB_PASSWORD"):
        os.environ["DB_PASSWORD"] = "YourStrong@Passw0rd"
    
    logger.info(f"Database configuration:")
    logger.info(f"  Server: {os.getenv('DB_SERVER')}:{os.getenv('DB_PORT')}")
    logger.info(f"  Database: {os.getenv('DB_NAME')}")
    logger.info(f"  User: {os.getenv('DB_USER')}")
    
    try:
        # Initialize database
        if initialize_database():
            logger.info("Database initialization completed successfully!")
            
            # Test connection
            if test_connection():
                logger.info("Database connection test passed!")
            else:
                logger.error("Database connection test failed!")
                return False
        else:
            logger.error("Database initialization failed!")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ Database initialization completed successfully!")
        print("You can now start the FastAPI application.")
    else:
        print("\n❌ Database initialization failed!")
        print("Please check the error messages above and fix any issues.")
        sys.exit(1)
