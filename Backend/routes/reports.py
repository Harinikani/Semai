from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.reports import Report, ReportCreate, ReportResponse
from models.scanned_species import ScannedSpecies
from models.user import User
from routes.auth import get_current_user  # Fixed import

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/", response_model=list[ReportResponse])
async def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reports for the current user"""
    reports = db.query(Report).filter(Report.user_id == current_user.id).all()
    return reports

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific report by ID"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user owns the report
    if report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report"
        )
    
    return report

@router.post("/", response_model=ReportResponse)
async def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new report"""
    # Check if scanned_species exists and belongs to user
    scanned_species = db.query(ScannedSpecies).filter(
        ScannedSpecies.id == report_data.scanned_species_id,
        ScannedSpecies.user_id == current_user.id
    ).first()
    
    if not scanned_species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scanned species not found or access denied"
        )
    
    # Create new report
    db_report = Report(
        **report_data.model_dump(),
        user_id=current_user.id
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: str,
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user owns the report
    if report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this report"
        )
    
    # Check if scanned_species exists and belongs to user
    scanned_species = db.query(ScannedSpecies).filter(
        ScannedSpecies.id == report_data.scanned_species_id,
        ScannedSpecies.user_id == current_user.id
    ).first()
    
    if not scanned_species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scanned species not found or access denied"
        )
    
    # Update report fields
    for field, value in report_data.model_dump().items():
        setattr(report, field, value)
    
    db.commit()
    db.refresh(report)
    
    return report

@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user owns the report
    if report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this report"
        )
    
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}