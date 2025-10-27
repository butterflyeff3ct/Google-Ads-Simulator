"""
Database Configuration and Connection Setup
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import pyodbc
from typing import Generator
import logging
from urllib.parse import quote_plus

# Database configuration
DATABASE_CONFIG = {
    "server": os.getenv("DB_SERVER", "localhost"),
    "port": os.getenv("DB_PORT", "1433"),
    "database": os.getenv("DB_NAME", "GoogleAdsSim"),
    "username": os.getenv("DB_USER", "sa"),
    "password": os.getenv("DB_PASSWORD", "YourStrong@Passw0rd"),
    "driver": os.getenv("DB_DRIVER", "SQL Server"),
    "trusted_connection": os.getenv("DB_TRUSTED_CONNECTION", "no").lower() == "yes"
}

def get_connection_string():
    """Build SQL Server connection string"""
    if DATABASE_CONFIG["trusted_connection"]:
        # Windows Authentication
        conn_str = (
            f"mssql+pyodbc://{DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']}/"
            f"{DATABASE_CONFIG['database']}?driver={quote_plus(DATABASE_CONFIG['driver'])}&trusted_connection=yes"
        )
    else:
        # SQL Server Authentication
        conn_str = (
            f"mssql+pyodbc://{quote_plus(DATABASE_CONFIG['username'])}:{quote_plus(DATABASE_CONFIG['password'])}@"
            f"{DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']}/"
            f"{DATABASE_CONFIG['database']}?driver={quote_plus(DATABASE_CONFIG['driver'])}"
        )
    
    return conn_str

# Create engine with connection pooling
engine = create_engine(
    get_connection_string(),
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_session():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            test_value = result.fetchone()[0]
            if test_value == 1:
                logging.info("Database connection successful")
                return True
            else:
                logging.error("Database connection test failed")
                return False
    except Exception as e:
        logging.error(f"Database connection failed: {str(e)}")
        return False

def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    try:
        # Use pyodbc directly for database creation
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE=master;UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT name FROM sys.databases WHERE name = '{DATABASE_CONFIG['database']}'")
        
        if not cursor.fetchone():
            # Create database
            cursor.execute(f"CREATE DATABASE [{DATABASE_CONFIG['database']}]")
            logging.info(f"Database '{DATABASE_CONFIG['database']}' created successfully")
        else:
            logging.info(f"Database '{DATABASE_CONFIG['database']}' already exists")
        
        conn.close()
        return True
        
    except Exception as e:
        logging.error(f"Error creating database: {str(e)}")
        return False

def create_tables():
    """Create all database tables"""
    try:
        # Use pyodbc directly to create tables
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        # Create Users table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
            CREATE TABLE users (
                id NVARCHAR(36) PRIMARY KEY,
                email NVARCHAR(255) UNIQUE NOT NULL,
                name NVARCHAR(255) NOT NULL,
                provider NVARCHAR(50) NOT NULL,
                profile_pic NVARCHAR(500),
                status NVARCHAR(20) DEFAULT 'active',
                signup_timestamp DATETIME2 DEFAULT GETUTCDATE(),
                first_login DATETIME2,
                last_login DATETIME2,
                approval_date DATETIME2,
                denial_reason NTEXT,
                reapply_count INT DEFAULT 0,
                added_by NVARCHAR(100) DEFAULT 'system',
                notes NTEXT
            )
        """)
        
        # Create User Activities table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_activities' AND xtype='U')
            CREATE TABLE user_activities (
                id NVARCHAR(36) PRIMARY KEY,
                user_id NVARCHAR(36) NOT NULL,
                session_id NVARCHAR(100) NOT NULL,
                login_time DATETIME2 NOT NULL,
                logout_time DATETIME2,
                status NVARCHAR(20) DEFAULT 'active',
                duration_mins INT DEFAULT 0,
                page_views INT DEFAULT 0,
                actions_taken NVARCHAR(MAX),
                ip_address NVARCHAR(45),
                last_activity DATETIME2,
                idle_timeout INT DEFAULT 15,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create Campaigns table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaigns' AND xtype='U')
            CREATE TABLE campaigns (
                id NVARCHAR(36) PRIMARY KEY,
                user_id NVARCHAR(36) NOT NULL,
                name NVARCHAR(255) NOT NULL,
                type NVARCHAR(50) DEFAULT 'search',
                daily_budget FLOAT NOT NULL,
                bidding_strategy NVARCHAR(50) DEFAULT 'manual_cpc',
                status NVARCHAR(20) DEFAULT 'draft',
                created_at DATETIME2 DEFAULT GETUTCDATE(),
                updated_at DATETIME2 DEFAULT GETUTCDATE(),
                campaign_data NVARCHAR(MAX),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create Simulations table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='simulations' AND xtype='U')
            CREATE TABLE simulations (
                id NVARCHAR(36) PRIMARY KEY,
                user_id NVARCHAR(36) NOT NULL,
                campaign_id NVARCHAR(36),
                simulation_type NVARCHAR(50) DEFAULT 'auction',
                settings NVARCHAR(MAX),
                results NVARCHAR(MAX),
                status NVARCHAR(20) DEFAULT 'running',
                created_at DATETIME2 DEFAULT GETUTCDATE(),
                completed_at DATETIME2,
                execution_time_ms INT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE NO ACTION
            )
        """)
        
        # Create Keyword Data table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='keyword_data' AND xtype='U')
            CREATE TABLE keyword_data (
                id NVARCHAR(36) PRIMARY KEY,
                keyword NVARCHAR(255) NOT NULL,
                match_type NVARCHAR(20) NOT NULL,
                avg_cpc FLOAT,
                competition NVARCHAR(20),
                search_volume INT,
                quality_score INT,
                created_at DATETIME2 DEFAULT GETUTCDATE(),
                updated_at DATETIME2 DEFAULT GETUTCDATE()
            )
        """)
        
        # Create Access Requests table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='access_requests' AND xtype='U')
            CREATE TABLE access_requests (
                id NVARCHAR(36) PRIMARY KEY,
                email NVARCHAR(255) NOT NULL,
                name NVARCHAR(255) NOT NULL,
                company NVARCHAR(255),
                role NVARCHAR(100),
                reason NTEXT,
                status NVARCHAR(20) DEFAULT 'pending',
                requested_at DATETIME2 DEFAULT GETUTCDATE(),
                reviewed_at DATETIME2,
                reviewed_by NVARCHAR(100),
                notes NTEXT
            )
        """)
        
        # Create indexes (SQL Server doesn't support IF NOT EXISTS for indexes)
        try:
            cursor.execute("CREATE INDEX idx_users_email ON users(email)")
        except:
            pass  # Index might already exist
        
        try:
            cursor.execute("CREATE INDEX idx_user_activities_user_id ON user_activities(user_id)")
        except:
            pass
        
        try:
            cursor.execute("CREATE INDEX idx_user_activities_session_id ON user_activities(session_id)")
        except:
            pass
        
        try:
            cursor.execute("CREATE INDEX idx_campaigns_user_id ON campaigns(user_id)")
        except:
            pass
        
        try:
            cursor.execute("CREATE INDEX idx_simulations_user_id ON simulations(user_id)")
        except:
            pass
        
        try:
            cursor.execute("CREATE INDEX idx_keyword_data_keyword ON keyword_data(keyword)")
        except:
            pass
        
        try:
            cursor.execute("CREATE INDEX idx_access_requests_email ON access_requests(email)")
        except:
            pass
        
        conn.close()
        logging.info("Database tables created successfully")
        return True
        
    except Exception as e:
        logging.error(f"Error creating tables: {str(e)}")
        return False

def initialize_database():
    """Initialize database - create if needed and create tables"""
    logging.info("Initializing database...")
    
    # Test connection first
    if not test_connection():
        # Try to create database if connection fails
        logging.info("Connection failed, attempting to create database...")
        if not create_database_if_not_exists():
            logging.error("Failed to create database")
            return False
    
    # Create tables
    if not create_tables():
        logging.error("Failed to create tables")
        return False
    
    logging.info("Database initialization completed successfully")
    return True
