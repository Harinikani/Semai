# =============================================================================
# FILE: database.py
# DESCRIPTION: Database configuration for Cloud SQL
# =============================================================================

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from google.cloud.sql.connector import Connector
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Cloud SQL connection details
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS")
DB_NAME = os.environ.get("DB_NAME", "capstone")
INSTANCE_CONNECTION_NAME = os.environ.get("INSTANCE_CONNECTION_NAME", "gaia-capstone8-prd:us-central1:booksdb")

print(f"Database configuration: User={DB_USER}, DB={DB_NAME}, Instance={INSTANCE_CONNECTION_NAME}")

# Initialize Cloud SQL Connector
connector = Connector()

def getconn():
    """
    Get database connection using Cloud SQL Connector with password authentication
    """
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,  
        "pg8000",
        user=DB_USER,
        password=DB_PASS,  # Use password authentication
        db=DB_NAME,
        enable_iam_auth=False  # Disable IAM authentication
    )
    return conn

# Create SQLAlchemy engine with Cloud SQL Connector
engine = create_engine(
    "postgresql+pg8000://",
    creator=getconn,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    echo=True
)

# Create sessionmaker and Base
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()