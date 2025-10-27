"""
Logging Utilities

Centralized logging configuration
"""
import logging
import sys
from datetime import datetime


def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """
    Setup and configure logger
    
    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    
    # Add handler to logger
    if not logger.handlers:
        logger.addHandler(handler)
    
    return logger


def log_api_request(endpoint: str, user_id: str, duration_ms: int) -> None:
    """
    Log API request details
    
    Args:
        endpoint: API endpoint called
        user_id: User making the request
        duration_ms: Request duration in milliseconds
    """
    logger = logging.getLogger("api")
    logger.info(
        f"API Request - Endpoint: {endpoint} | User: {user_id} | "
        f"Duration: {duration_ms}ms | Timestamp: {datetime.now().isoformat()}"
    )


def log_simulation_run(run_id: str, seed: int, duration_ms: int, num_keywords: int) -> None:
    """
    Log simulation run details
    
    Args:
        run_id: Unique run identifier
        seed: Random seed used
        duration_ms: Simulation duration in milliseconds
        num_keywords: Number of keywords simulated
    """
    logger = logging.getLogger("simulation")
    logger.info(
        f"Simulation Run - ID: {run_id} | Seed: {seed} | "
        f"Keywords: {num_keywords} | Duration: {duration_ms}ms"
    )


# Initialize default logger
default_logger = setup_logger("app", "INFO")
