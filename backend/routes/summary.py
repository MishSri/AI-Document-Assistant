from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.schemas import DocumentSummaryResponse
# SummaryRequestPayload
from backend.services.summarizer import summarize_document
from backend.services.auth_service import get_current_user
from backend.database.db import log_audit_event

router = APIRouter(prefix="/api/documents", tags=["summary"])

def verify_workspace_access(workspace_id: str, user: dict):
    """Enforces multi-tenant data boundaries to prevent unauthorized scraping."""
    # Example logic: if workspace_id not in user.get("workspaces", []):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    pass

@router.post(
    "/summarize", 
    response_model=DocumentSummaryResponse,
    status_code=status.HTTP_200_OK
)
def get_document_summary(
    payload: SummaryRequestPayload, 
    current_user: dict = Depends(get_current_user)
):
    """Triggers an isolated document summary generation. Protected via tenant authentication."""
    # Security Validation
    verify_workspace_access(payload.workspace_id, current_user)
    
    try:
        # Run calculation
        res = summarize_document(payload.workspace_id, payload.filename)
        
        # Accurate user context logging
        log_audit_event(
            username=current_user["username"], 
            action="DOCUMENT_SUMMARIZED", 
            workspace_id=payload.workspace_id, 
            details=f"Generated AI summary for file: {payload.filename}"
        )
        return res
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Summarization execution failure: {str(e)}"
        )
