from fastapi import APIRouter
from backend.database.db import get_audit_logs, log_audit_event
from backend.models.schemas import AuditLogEntry

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("", response_model=list[AuditLogEntry])
def list_audit_logs():
    return get_audit_logs()

@router.post("")
def create_audit_entry(username: str, action: str, workspace_id: str, details: str):
    entry = log_audit_event(username, action, workspace_id, details)
    return entry
