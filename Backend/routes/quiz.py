import os,json
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from models.scanned_species import ScannedSpecies
from models.species import Species
from models.user import User
from database import get_db
from routes.auth import get_current_user

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser


from pydantic import BaseModel, Field

load_dotenv()
# -------------------------
# Pydantic models for output
# -------------------------
class QuizItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explaination: str

class QuizResponse(BaseModel):
    quizzes: List[QuizItem]

class PointsRequest(BaseModel):
    points: int
    currency: int
    
# -------------------------
# Initialize LLM
# -------------------------
llm = ChatGoogleGenerativeAI(
    # Fill in your parameters as required
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.2
)

# -------------------------
# Output parser
# -------------------------
output_parser = JsonOutputParser(pydantic_object=QuizResponse)



# -------------------------
# Router setup
# -------------------------
router = APIRouter(prefix="/quiz", tags=["quiz"])

# -------------------------
# Route: Get user species + generate quiz
# -------------------------
@router.get("/generate-specific-quiz", response_model=QuizResponse)
async def generate_quiz_for_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate wildlife quiz questions based on species scanned by the current user.
    Location is fixed to 'Malaysia' and species data is read from the Species table.
    """
    try:

        # -------------------------
        # Prompt template
        # -------------------------
        chat_prompt = ChatPromptTemplate.from_messages(
                    [
                        (
                            "system",
                            """You are a zoologist and wildlife biologist. 
                            Generate 5 realistic and short multiple-choice quiz questions about animals found in the specified list of species 
                            that were scanned by the user. 
                            Each quiz should be realistic and related to the actual biology, behavior, habitat, or conservation status 
                            of those animals. 

                            Return your answer strictly in this JSON format:
                            {{ 
                                "quizzes": [
                                    {{
                                    "question": "Question text here",
                                    "options": ["Option A", "Option B", "Option C", "Option D"],
                                    "correct_answer": "The text from the correct option.",
                                    "explaination": "A short and easy explaination of the correct answer"
                                    
                                    }}
                                ]
                                }}

                            Requirements:
                            - 5 total questions
                            - 4 options each
                            - Use facts tied to the species when possible
                            
                            """
                        ),
                        (
                            "user",
                            "{request}\n\n{format_instructions}"
                        )
                    ]
                )

        chain = chat_prompt | llm | output_parser
       
        # 1) Query Species joined from scanned_species for this user 
        species_rows: List[Species] = (
            db.query(Species)
            .join(ScannedSpecies, Species.id == ScannedSpecies.species_id)
            .filter(ScannedSpecies.user_id == current_user.id)
            .all()
        )

        if not species_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No scanned species found for this user."
            )

        # 2) Build descriptive snippet for the LLM prompt.
        # Limit the number of species passed to avoid overly long prompts (e.g. first 10)
        species_rows = species_rows[:10]
        species_summaries = []
        species_names = []
        for s in species_rows:
            cname = getattr(s, "common_name", None) or getattr(s, "scientific_name", None) or str(getattr(s, "id", "unknown"))
            species_names.append(cname)
            desc = getattr(s, "description", "") or ""
            habitat = getattr(s, "habitat", "") or ""
            species_summaries.append(f"{cname} — habitat: {habitat}; notes: {desc}")

        species_text = "; ".join(species_summaries)
        names_text = ", ".join(species_names)

        # 3) Build the LLM user request. Location is fixed: Malaysia
        request_text = (
            f"Using the following species observed by the user in Malaysia: {names_text}. "
            f"Here are brief species notes: {species_text}. "
            "Generate 5 realistic multiple-choice quiz questions (4 options each) about these species. "
            "Questions should be tied to behavior, adaptations, habitat, diet or conservation where possible."
        )

        # 4) Invoke the chain
        ai_msg = chain.invoke({
            "request": request_text,
            "format_instructions": output_parser.get_format_instructions()
        })

        # 5) Return parsed result (support both dict or parsed model)
        if isinstance(ai_msg, QuizResponse):
            return ai_msg

        return QuizResponse.parse_obj(ai_msg)

    except HTTPException:
        raise
    except Exception as e:
        # Consider logging e in production
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")
    

#-------------------------
# Route: Get user species + generate quiz
# -------------------------
@router.get("/generate-general-quiz", response_model=QuizResponse)
async def generate_general_quiz(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate wildlife quiz questions based on species scanned by the current user.
    Location is fixed to 'Malaysia' and species data is read from the Species table.
    """
    try:

        # -------------------------
        # Prompt template
        # -------------------------
        chat_prompt = ChatPromptTemplate.from_messages(
                    [
                        (
                            "system",
                            """You are a zoologist and wildlife biologist. 
                            Generate 5 realistic and short multiple-choice quiz questions about any animals in Malaysia. 
                            Each quiz should be realistic and related to the actual biology, behavior, habitat, or conservation status 
                            of those animals. 

                            Return your answer strictly in this JSON format:
                            {{ 
                                "quizzes": [
                                    {{
                                    "question": "Question text here",
                                    "options": ["Option A", "Option B", "Option C", "Option D"],
                                    "correct_answer": "The text from the correct option.",
                                    "explaination": "A short and easy explaination of the correct answer"
                                    
                                    }}
                                ]
                                }}

                            Requirements:
                            - 5 total questions
                            - 4 options each
                            - Use facts tied to the species when possible
                            
                            """
                        ),
                        (
                            "user",
                            "{request}\n\n{format_instructions}"
                        )
                    ]
                )

        chain = chat_prompt | llm | output_parser
       
       

        # 3) Build the LLM user request. Location is fixed: Malaysia
        request_text = (
            
            "Generate 5 realistic multiple-choice quiz questions (4 options each) about any species in Malaysia. "
            "Questions should be tied to behavior, adaptations, habitat, diet or conservation where possible."
        )

        # 4) Invoke the chain
        ai_msg = chain.invoke({
            "request": request_text,
            "format_instructions": output_parser.get_format_instructions()
        })

        # 5) Return parsed result (support both dict or parsed model)
        if isinstance(ai_msg, QuizResponse):
            return ai_msg

        return QuizResponse.parse_obj(ai_msg)

    except HTTPException:
        raise
    except Exception as e:
        # Consider logging e in production
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.post("/add-user-points")
async def add_user_points(
    points_data: PointsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add points and currency to user's total"""
    try:
        points = points_data.points
        currency = points_data.currency
        
        current_user.points = (current_user.points or 0) + points
        current_user.currency = (current_user.currency or 0) + currency
        
        db.commit()
        return {
            "message": f"Added {points} points and {currency} currency", 
            "total_points": current_user.points,
            "total_currency": current_user.currency
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add points and currency: {str(e)}")