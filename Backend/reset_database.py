# =============================================================================
# FILE: reset_database.py
# DESCRIPTION: Database reset and seeding functionality
# =============================================================================

import sys
import os

# Add the current directory to Python path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from relationships import setup_relationships

# Import all models
from models.user import User
from models.animal_class import AnimalClass
from models.species import Species
from models.scanned_species import ScannedSpecies
from models.reports import Report
from models.friendships import Friendship
from models.vouchers import Voucher
from models.user_vouchers import UserVoucher
from models.points_transactions import PointsTransaction

# Import data loader
from utils.data_loader import get_animal_classes_data, get_endangered_species_data, get_common_species_data

# =============================================================================
# DATABASE SEEDING FUNCTIONS
# =============================================================================

def _validate_species_data(species_data: dict) -> bool:
    """
    Validate species data structure
    """
    required_fields = [
        "animal_class", "common_name", "scientific_name", "description",
        "habitat", "threats", "conservation", "endangered_status"
    ]
    
    if not isinstance(species_data, dict):
        print(f"❌ Invalid species data type: {type(species_data)}")
        return False
        
    missing_fields = [field for field in required_fields if field not in species_data]
    if missing_fields:
        print(f"❌ Missing fields in species data: {missing_fields}")
        return False
        
    return True

def create_sample_data(db: Session) -> None:
    print("\n" + "="*50)
    print("🌱 STARTING DATABASE SEEDING PROCESS")
    print("="*50)
    
    try:
        # Load data from JSON files
        print("\n📥 LOADING DATA FROM JSON FILES...")
        animal_classes_data = get_animal_classes_data()
        endangered_species_data = get_endangered_species_data()
        common_species_data = get_common_species_data()
        
        print(f"✅ Loaded {len(animal_classes_data)} animal classes")
        print(f"✅ Loaded {len(endangered_species_data)} endangered species") 
        print(f"✅ Loaded {len(common_species_data)} common species")
        
        # Create animal classes
        print("\n🗃️ CREATING ANIMAL CLASSES...")
        animal_class_map = {}  # Map to store class_name -> AnimalClass ID
        
        for class_data in animal_classes_data:
            if not isinstance(class_data, dict):
                print(f"❌ Invalid animal class data: {class_data}")
                continue
                
            if "id" not in class_data or "class_name" not in class_data:
                print(f"❌ Missing required fields in animal class: {class_data}")
                continue
            
            # Use the ID from JSON instead of generating UUID
            animal_class = AnimalClass(
                id=class_data["id"],  # Use "mammals", "birds", etc.
                class_name=class_data["class_name"]
            )
            db.add(animal_class)
            animal_class_map[class_data["id"]] = animal_class.id
            print(f"   ✅ Created: {class_data['class_name']} (ID: {class_data['id']})")

        # Commit animal classes first
        db.commit()
        print("✅ Animal classes committed to database")

        # Create endangered species
        print("\n🦁 CREATING ENDANGERED SPECIES...")
        endangered_count = 0
        
        for species_data in endangered_species_data:
            if not _validate_species_data(species_data):
                continue
            
            # Get the animal_class_id from our map
            animal_class_id = animal_class_map.get(species_data["animal_class"])
            if not animal_class_id:
                print(f"❌ Animal class not found: {species_data['animal_class']}")
                continue
                
            species = Species(
                animal_class_id=animal_class_id,
                common_name=species_data["common_name"],
                scientific_name=species_data["scientific_name"],
                description=species_data["description"],
                habitat=species_data["habitat"],
                threats=species_data["threats"],
                conservation=species_data["conservation"],
                endangered_status=species_data["endangered_status"]
            )
            db.add(species)
            endangered_count += 1
            print(f"   ✅ Created: {species_data['common_name']}")

        # Create common species  
        print("\n🐦 CREATING COMMON SPECIES...")
        common_count = 0
        
        for species_data in common_species_data:
            if not _validate_species_data(species_data):
                continue
            
            # Get the animal_class_id from our map
            animal_class_id = animal_class_map.get(species_data["animal_class"])
            if not animal_class_id:
                print(f"❌ Animal class not found: {species_data['animal_class']}")
                continue
                
            species = Species(
                animal_class_id=animal_class_id,
                common_name=species_data["common_name"],
                scientific_name=species_data["scientific_name"],
                description=species_data["description"],
                habitat=species_data["habitat"],
                threats=species_data["threats"],
                conservation=species_data["conservation"],
                endangered_status=species_data["endangered_status"]
            )
            db.add(species)
            common_count += 1
            print(f"   ✅ Created: {species_data['common_name']}")

        # Create sample vouchers
        print("\n🎫 CREATING SAMPLE VOUCHERS...")
        from datetime import date, timedelta
        
        sample_vouchers = [
            {
                "title": "Wildlife Conservation Donation",
                "description": "Donate RM10 to wildlife conservation efforts",
                "points_required": 100,
                "expiry_date": date.today() + timedelta(days=30),
                "merchant_name": "Wildlife Trust"
            },
            {
                "title": "Eco-Friendly Water Bottle",
                "description": "Get a reusable eco-friendly water bottle",
                "points_required": 200,
                "expiry_date": date.today() + timedelta(days=60),
                "merchant_name": "GreenLife Store"
            },
            {
                "title": "Nature Photography Book",
                "description": "Beautiful photography book of Malaysian wildlife",
                "points_required": 300,
                "expiry_date": date.today() + timedelta(days=90),
                "merchant_name": "Nature Publications"
            }
        ]
        
        for voucher_data in sample_vouchers:
            voucher = Voucher(**voucher_data)
            db.add(voucher)
            print(f"   ✅ Created: {voucher_data['title']}")

        # Final commit
        db.commit()
        
        # Success summary
        print("\n" + "="*50)
        print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*50)
        print(f"📊 Animal Classes: {len(animal_classes_data)}")
        print(f"📊 Endangered Species: {endangered_count}")
        print(f"📊 Common Species: {common_count}")
        print(f"📊 Total Species: {endangered_count + common_count}")
        print(f"📊 Sample Vouchers: {len(sample_vouchers)}")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ ERROR DURING SEEDING: {e}")
        db.rollback()
        raise

def reset_database() -> None:
    """
    Reset and seed the database with sample data
    """
    print("\n" + "="*50)
    print("🔄 DATABASE RESET PROCESS STARTED")
    print("="*50)
    
    # Drop all tables and recreate them
    print("\n🗑️ DROPPING EXISTING TABLES...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tables dropped successfully")
    
    print("\n🏗️ CREATING NEW TABLES...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")
    
    print("\n🔗 SETTING UP RELATIONSHIPS...")
    setup_relationships()
    print("✅ Relationships configured")
    
    # Create database session for seeding
    db = SessionLocal()
    try:
        create_sample_data(db)
        print("\n✨ DATABASE RESET COMPLETED SUCCESSFULLY!")
    except Exception as e:
        print(f"\n💥 DATABASE RESET FAILED: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    """
    Execute database reset when run directly
    """
    reset_database()