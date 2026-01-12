# routes/badges.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from database import get_db
from models.user import User
from models.animal_class import AnimalClass
from models.species import Species
from models.scanned_species import ScannedSpecies
from routes.auth import get_current_user
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from species_scanner import classify_species_by_name
import logging

router = APIRouter(prefix="/api/badges", tags=["badges"])
logger = logging.getLogger(__name__)

# Badge configuration - maps animal class names to icons and colors
BADGE_CONFIG = {
    "Mammals": {"icon": "🐘", "color": "from-purple-200 to-purple-500"},
    "Birds": {"icon": "🐦", "color": "from-blue-200 to-blue-500"}, 
    "Reptiles": {"icon": "🦎", "color": "from-green-200 to-green-500"},
    "Amphibians": {"icon": "🐸", "color": "from-lime-200 to-lime-500"},
    "Fish": {"icon": "🐠", "color": "from-cyan-200 to-cyan-500"},
    "Insects": {"icon": "🦋", "color": "from-pink-200 to-pink-500"},
    "Arachnids": {"icon": "🕷️", "color": "from-red-200 to-red-500"},
    "Crustaceans": {"icon": "🦐", "color": "from-orange-200 to-orange-500"},
    "Mollusks": {"icon": "🐌", "color": "from-yellow-200 to-yellow-500"},
    "Marine Mammals": {"icon": "🐬", "color": "from-teal-200 to-teal-500"},
    "Primates": {"icon": "🐵", "color": "from-brown-200 to-brown-500"},
    "Big Cats": {"icon": "🐯", "color": "from-amber-200 to-amber-500"}
}

def get_correct_animal_class_for_species(species_name: str, current_animal_class: AnimalClass, db: Session) -> AnimalClass:
    """
    Use AI classification to verify and correct animal class assignment
    """
    try:
        # Skip if we already have a valid animal class
        if current_animal_class and current_animal_class.class_name != "Unknown":
            # Use AI to verify the classification
            classification_result = classify_species_by_name(species_name)
            
            if classification_result.get("status") == "success":
                ai_category = classification_result["classification"].get("category")
                if ai_category and ai_category.lower() != current_animal_class.class_name.lower():
                    logger.info(f"🔄 AI suggests different class for {species_name}: {ai_category} (was {current_animal_class.class_name})")
                    
                    # Find the correct animal class
                    correct_class = db.query(AnimalClass).filter(
                        AnimalClass.class_name.ilike(ai_category)
                    ).first()
                    
                    if correct_class:
                        logger.info(f"✅ Correcting {species_name} from {current_animal_class.class_name} to {correct_class.class_name}")
                        return correct_class
        
        return current_animal_class
        
    except Exception as e:
        logger.warning(f"AI classification failed for {species_name}: {str(e)}")
        return current_animal_class

# ✅ ADD THIS FUNCTION: Enhanced species classification
def classify_species_fallback(species_name: str) -> str:
    """
    Fallback classification using keyword matching
    """
    species_lower = species_name.lower()
    
    # Bird patterns - INCLUDING SHOEBILL
    bird_keywords = [
        'bird', 'eagle', 'owl', 'hawk', 'falcon', 'hornbill', 'parrot', 'penguin', 
        'flamingo', 'sparrow', 'crow', 'raven', 'pigeon', 'dove', 'duck', 'goose', 
        'swan', 'stork', 'heron', 'kingfisher', 'woodpecker', 'hummingbird', 
        'shoebill', 'pelican', 'seagull', 'vulture', 'ostrich', 'emu', 'kiwi',
        'cockatoo', 'macaw', 'toucan', 'canary', 'finch', 'robin', 'bluejay',
        'balaeniceps'  # Shoebill's scientific genus
    ]
    if any(keyword in species_lower for keyword in bird_keywords):
        return "Birds"
    
    # Mammal patterns
    mammal_keywords = [
        'tiger', 'lion', 'elephant', 'bear', 'wolf', 'fox', 'deer', 'monkey', 
        'ape', 'gorilla', 'chimpanzee', 'orangutan', 'whale', 'dolphin', 'bat', 
        'rodent', 'squirrel', 'rabbit', 'kangaroo', 'koala', 'panda', 'zebra'
    ]
    if any(keyword in species_lower for keyword in mammal_keywords):
        return "Mammals"
    
    return "Unknown"

def calculate_badge_level(discovered_count: int, total_count: int) -> Dict[str, Any]:
    """Calculate badge level based on COUNT of species discovered"""
    if discovered_count >= 11:
        return {
            "level": "Gold",
            "color": "from-yellow-200 to-yellow-500 drop-shadow-sm",
            "textColor": "text-amber-600",
            "bgColor": "bg-yellow-50",
            "percentage": (discovered_count / total_count) * 100 if total_count > 0 else 0
        }
    elif discovered_count >= 6:
        return {
            "level": "Silver", 
            "color": "from-gray-200 to-gray-400 drop-shadow-sm",
            "textColor": "text-gray-600",
            "bgColor": "bg-gray-50",
            "percentage": (discovered_count / total_count) * 100 if total_count > 0 else 0
        }
    elif discovered_count >= 1:
        return {
            "level": "Bronze",
            "color": "from-amber-200 to-amber-800 drop-shadow-sm", 
            "textColor": "text-orange-600",
            "bgColor": "bg-amber-50",
            "percentage": (discovered_count / total_count) * 100 if total_count > 0 else 0
        }
    else:
        return {
            "level": "Locked",
            "color": "from-gray-200 to-gray-300",
            "textColor": "text-gray-400",
            "bgColor": "bg-gray-100", 
            "percentage": 0
        }

@router.get("/", response_model=List[Dict[str, Any]])
async def get_user_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all badges with progress for the current user
    Returns badge data for each animal class with discovered species count
    """
    try:
        # Get all animal classes from database
        animal_classes = db.query(AnimalClass).all()
        
        badges = []
        
        for animal_class in animal_classes:
            # Count total species in this animal class
            total_species = db.query(Species).filter(
                Species.animal_class_id == animal_class.id
            ).count()
            
            # ✅ ENHANCED: Get discovered species with AI verification
            discovered_species_query = db.query(ScannedSpecies).join(Species).filter(
                ScannedSpecies.user_id == current_user.id,
                Species.animal_class_id == animal_class.id
            )
            
            discovered_species = discovered_species_query.count()
            
            # Get badge configuration (icon and color)
            badge_config = BADGE_CONFIG.get(
                animal_class.class_name, 
                {"icon": "❓", "color": "from-gray-200 to-gray-400"}
            )
            
            # Calculate badge level and styling - NOW COUNT-BASED
            badge_level = calculate_badge_level(discovered_species, total_species)
            
            # ✅ ENHANCED: Get discovered species names with AI verification
            discovered_species_data = db.query(Species).join(ScannedSpecies).filter(
                ScannedSpecies.user_id == current_user.id,
                Species.animal_class_id == animal_class.id
            ).limit(10).all()
            
            # Verify each species belongs to the correct animal class
            verified_discovered_species = []
            for species in discovered_species_data:
                # Use AI to verify animal class
                verified_class = get_correct_animal_class_for_species(
                    species.common_name, 
                    animal_class, 
                    db
                )
                
                # If AI suggests a different class, log it but still count it
                if verified_class.id != animal_class.id:
                    logger.warning(f"⚠️ Species {species.common_name} might belong to {verified_class.class_name} not {animal_class.class_name}")
                
                verified_discovered_species.append(species.common_name)
            
            # Get list of undiscovered species names for this animal class
            undiscovered_species_names = db.query(Species.common_name).filter(
                Species.animal_class_id == animal_class.id,
                ~Species.id.in_(
                    db.query(ScannedSpecies.species_id).filter(
                        ScannedSpecies.user_id == current_user.id
                    )
                )
            ).limit(10).all()
            
            # Format badge data for frontend
            badge_data = {
                "id": str(animal_class.id),
                "category": animal_class.class_name,
                "icon": badge_config["icon"],
                "totalSpecies": total_species,
                "discoveredSpecies": discovered_species,
                "percentage": badge_level["percentage"],
                "badgeLevel": badge_level["level"],
                "gradientColor": badge_config["color"],
                "levelColor": badge_level["color"],
                "levelTextColor": badge_level["textColor"], 
                "levelBgColor": badge_level["bgColor"],
                "discovered": verified_discovered_species,  # ✅ Now uses verified species
                "undiscovered": [species[0] for species in undiscovered_species_names]
            }
            
            badges.append(badge_data)
        
        # Sort badges: unlocked first (by count), then locked
        badges.sort(key=lambda x: (x["discoveredSpecies"] == 0, -x["discoveredSpecies"]))
        
        return badges
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user badges: {str(e)}"
        )

@router.get("/{animal_class_id}", response_model=Dict[str, Any])
async def get_badge_details(
    animal_class_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information for a specific badge/animal class
    Includes complete lists of discovered and undiscovered species
    """
    try:
        # Get the animal class
        animal_class = db.query(AnimalClass).filter(
            AnimalClass.id == animal_class_id
        ).first()
        
        if not animal_class:
            raise HTTPException(status_code=404, detail="Animal class not found")
        
        # Count total species in this animal class
        total_species = db.query(Species).filter(
            Species.animal_class_id == animal_class.id
        ).count()
        
        # Count species discovered by this user in this animal class  
        discovered_species_count = db.query(ScannedSpecies).join(Species).filter(
            ScannedSpecies.user_id == current_user.id,
            Species.animal_class_id == animal_class.id
        ).count()
        
        # Get badge configuration
        badge_config = BADGE_CONFIG.get(
            animal_class.class_name, 
            {"icon": "❓", "color": "from-gray-200 to-gray-400"}
        )
        
        # Calculate badge level - NOW COUNT-BASED
        badge_level = calculate_badge_level(discovered_species_count, total_species)
        
        # Get ALL discovered species for this animal class
        discovered_species = db.query(
            Species.common_name,
            Species.scientific_name,
            Species.endangered_status
        ).join(ScannedSpecies).filter(
            ScannedSpecies.user_id == current_user.id,
            Species.animal_class_id == animal_class.id
        ).all()
        
        # Get ALL undiscovered species for this animal class
        undiscovered_species = db.query(
            Species.common_name, 
            Species.scientific_name,
            Species.endangered_status
        ).filter(
            Species.animal_class_id == animal_class.id,
            ~Species.id.in_(
                db.query(ScannedSpecies.species_id).filter(
                    ScannedSpecies.user_id == current_user.id
                )
            )
        ).all()
        
        # Format species data for frontend
        discovered_formatted = [
            {
                "common_name": species.common_name,
                "scientific_name": species.scientific_name, 
                "endangered_status": species.endangered_status
            }
            for species in discovered_species
        ]
        
        undiscovered_formatted = [
            {
                "common_name": species.common_name,
                "scientific_name": species.scientific_name,
                "endangered_status": species.endangered_status
            }
            for species in undiscovered_species
        ]
        
        # Return detailed badge information
        badge_details = {
            "id": str(animal_class.id),
            "category": animal_class.class_name,
            "icon": badge_config["icon"],
            "totalSpecies": total_species,
            "discoveredSpecies": discovered_species_count,
            "percentage": badge_level["percentage"],
            "badgeLevel": badge_level["level"],
            "gradientColor": badge_config["color"],
            "levelColor": badge_level["color"],
            "levelTextColor": badge_level["textColor"],
            "levelBgColor": badge_level["bgColor"],
            "discovered": discovered_formatted,
            "undiscovered": undiscovered_formatted,
            "animalClassInfo": {
                "className": animal_class.class_name,
                "createdAt": animal_class.created_at
            }
        }
        
        return badge_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching badge details: {str(e)}"
        )

@router.get("/progress/summary")
async def get_badges_progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a summary of badge progress for the user
    Useful for displaying quick stats on profile/dashboard
    """
    try:
        # Get all animal classes
        animal_classes = db.query(AnimalClass).all()
        
        total_badges = len(animal_classes)
        unlocked_badges = 0
        gold_badges = 0
        silver_badges = 0
        bronze_badges = 0
        
        # Calculate badge progress for each animal class
        for animal_class in animal_classes:
            # Count species discovered by this user in this class
            discovered_species = db.query(ScannedSpecies).join(Species).filter(
                ScannedSpecies.user_id == current_user.id,
                Species.animal_class_id == animal_class.id
            ).count()
            
            # Count badge levels - NOW COUNT-BASED
            if discovered_species >= 11:
                gold_badges += 1
                unlocked_badges += 1
            elif discovered_species >= 6:
                silver_badges += 1
                unlocked_badges += 1
            elif discovered_species >= 1:
                bronze_badges += 1
                unlocked_badges += 1
        
        # Calculate total species discovered across all classes
        total_species_discovered = db.query(ScannedSpecies).filter(
            ScannedSpecies.user_id == current_user.id
        ).count()
        
        # Calculate total species in database
        total_species_in_db = db.query(Species).count()
        
        return {
            "totalBadges": total_badges,
            "unlockedBadges": unlocked_badges,
            "lockedBadges": total_badges - unlocked_badges,
            "goldBadges": gold_badges,
            "silverBadges": silver_badges,
            "bronzeBadges": bronze_badges,
            "totalSpeciesDiscovered": total_species_discovered,
            "totalSpeciesInDatabase": total_species_in_db,
            "overallProgress": (total_species_discovered / total_species_in_db * 100) if total_species_in_db > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating badge progress summary: {str(e)}"
        )