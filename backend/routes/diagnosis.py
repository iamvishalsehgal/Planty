"""Plant diagnosis endpoint."""

from fastapi import APIRouter, HTTPException

from models import DiagnosisRequest, DiagnosisResponse
from services.diagnosis import diagnose_plant

router = APIRouter(prefix="/api", tags=["diagnosis"])


@router.post("/diagnosis", response_model=DiagnosisResponse)
async def diagnose(request: DiagnosisRequest):
    """Analyze a plant photo and return a diagnosis."""
    try:
        result = await diagnose_plant(request.image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
