# routes/species.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.animal_class import AnimalClass, AnimalClassResponse
from models.species import Species, SpeciesResponse

router = APIRouter(prefix="/api/wildlife", tags=["Wildlife Catalog"])

# =============================================================================
# ANIMAL CLASSIFICATION ENDPOINTS
# =============================================================================

@router.get("/animal-classes", response_model=List[AnimalClassResponse])
async def get_all_animal_classes(db: Session = Depends(get_db)):
    """
    Retrieve complete list of animal classifications
    Returns all taxonomic classes (Mammals, Birds, Reptiles, etc.)
    """
    try:
        animal_classes = db.query(AnimalClass).all()
        return animal_classes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching animal classes: {str(e)}"
        )

@router.get("/animal-classes/by-name/{class_name}", response_model=AnimalClassResponse)
async def get_animal_class_by_name(class_name: str, db: Session = Depends(get_db)):
    """
    Find animal class by exact name match
    Case-insensitive search for taxonomic classes like 'Mammals', 'Birds', 'Reptiles'
    """
    animal_class = db.query(AnimalClass).filter(
        AnimalClass.class_name.ilike(class_name)
    ).first()
    if not animal_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Animal classification not found"
        )
    return animal_class

# =============================================================================
# SPECIES ENDPOINTS
# =============================================================================

@router.get("/species", response_model=List[SpeciesResponse])
async def get_all_species(db: Session = Depends(get_db)):
    """
    Retrieve complete wildlife species catalog
    Returns all species with common names, scientific names, and conservation status
    """
    try:
        species = db.query(Species).all()
        return species
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching species catalog: {str(e)}"
        )

@router.get("/species/search/{name}", response_model=List[SpeciesResponse])
async def search_species_by_name(name: str, db: Session = Depends(get_db)):
    """
    Search species by common or scientific name
    Flexible search across common names (e.g., 'Tiger') and scientific names (e.g., 'Panthera tigris')
    """
    try:
        species = db.query(Species).filter(
            (Species.common_name.ilike(f"%{name}%")) | 
            (Species.scientific_name.ilike(f"%{name}%"))
        ).all()
        return species
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search operation failed: {str(e)}"
        )

# =============================================================================
# EDUCATIONAL MODULE ENDPOINTS
# =============================================================================

@router.get("/animal-classes-with-species")
async def get_animal_classes_with_species(db: Session = Depends(get_db)):
    """
    Comprehensive taxonomy hierarchy for educational content
    Returns all animal classes with their associated species - perfect for learning modules and discovery quests
    """
    try:
        animal_classes = db.query(AnimalClass).all()
        result = []
        
        for animal_class in animal_classes:
            species_list = db.query(Species).filter(
                Species.animal_class_id == animal_class.id
            ).all()
            
            class_data = AnimalClassResponse.from_orm(animal_class)
            species_data = [SpeciesResponse.from_orm(species) for species in species_list]
            
            result.append({
                "animal_class": class_data,
                "species": species_data,
                "species_count": len(species_list)
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load educational content: {str(e)}"
        )

@router.get("/species-by-class/{class_name}", response_model=List[SpeciesResponse])
async def get_species_by_animal_class(class_name: str, db: Session = Depends(get_db)):
    """
    Filter species by animal classification
    Essential for AI identification feature - narrows down species by class (Mammals, Birds, etc.)
    """
    animal_class = db.query(AnimalClass).filter(
        AnimalClass.class_name.ilike(class_name)
    ).first()
    
    if not animal_class:
        all_classes = db.query(AnimalClass.class_name).all()
        available_classes = [ac[0] for ac in all_classes]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Animal class '{class_name}' not found. Available classifications: {', '.join(available_classes)}"
        )
    
    try:
        species = db.query(Species).filter(Species.animal_class_id == animal_class.id).all()
        return species
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve species for {class_name}: {str(e)}"
        )

# =============================================================================
# GAMIFICATION & LEARNING ENDPOINTS
# =============================================================================

@router.get("/random-species", response_model=List[SpeciesResponse])
async def get_random_species(
    count: int = 5,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Dynamic species selection for quizzes and challenges
    Returns random species - optionally filtered by class - for interactive learning games
    """
    try:
        from sqlalchemy import func
        
        query = db.query(Species)
        
        if class_name:
            animal_class = db.query(AnimalClass).filter(
                AnimalClass.class_name.ilike(class_name)
            ).first()
            
            if not animal_class:
                all_classes = db.query(AnimalClass.class_name).all()
                available_classes = [ac[0] for ac in all_classes]
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Animal class '{class_name}' not found. Available: {', '.join(available_classes)}"
                )
            
            query = query.filter(Species.animal_class_id == animal_class.id)
        
        random_species = query.order_by(func.random()).limit(count).all()
        return random_species
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz content: {str(e)}"
        )

# =============================================================================
# DATABASE MANAGEMENT
# =============================================================================

@router.post("/seed-database", status_code=status.HTTP_201_CREATED)
async def api_seed_database(db: Session = Depends(get_db)):
    """
    Initialize database with sample wildlife data
    ⚠️ WARNING: This operation removes all existing wildlife records and repopulates with default dataset
    Use for development, testing, or first-time setup only
    """
    try:
        print("🧹 Clearing existing wildlife data...")
        
        # Delete in correct order to respect foreign key constraints
        db.query(Species).delete()
        db.query(AnimalClass).delete()
        db.commit()
        
        print("🌱 Seeding database with sample wildlife data...")
        from reset_database import seed_database_via_api
        result = seed_database_via_api(db)
        
        result["message"] = "Database successfully reset and populated with sample wildlife data"
        return result
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database seeding failed: {str(e)}"
        )