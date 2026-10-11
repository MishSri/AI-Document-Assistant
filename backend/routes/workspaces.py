import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from backend.models.schemas import WorkspaceCreate, WorkspaceResponse
from backend.database.db import (
    add_workspace_record, 
    remove_workspace_record, 
    get_workspace_by_name,
    get_all_workspaces, 
    log_audit_event
)
from backend.services.auth_service import get_current_user
from backend.services.rag import chroma_client

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

def verify_admin_privileges(user: dict):
    """Enforces role validation limits over infrastructure modifications."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrative authentication privileges required."
        )

@router.get("", response_model=list[WorkspaceResponse])
def get_workspaces(current_user: dict = Depends(get_current_user)):
    """Retrieves all registered application tenants. Protected via active login."""
    return get_all_workspaces()

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(ws: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    """Registers a new corporate workspace collection atomically to prevent data overwrite races."""
    verify_admin_privileges(current_user)
    username = current_user["username"]
    
    # Performance Fix: Check specific indexed duplicate field value directly 
    if get_workspace_by_name(ws.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Workspace with this name already exists"
        )
        
    new_ws = {
        "id": str(uuid.uuid4()),
        "name": ws.name,
        "description": ws.description,
        "department": ws.department,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    # Concurrency Fix: Atomic append/write executed directly within DB transactions
    add_workspace_record(new_ws)
    
    log_audit_event(
        username, 
        "WORKSPACE_CREATED", 
        new_ws["id"], 
        f"Created workspace '{ws.name}'"
    )
    return new_ws

@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Purges a workspace partition ledger and scrubs related vector database weights."""
    verify_admin_privileges(current_user)
    username = current_user["username"]
    
    if workspace_id == "default":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot delete default system partition workspace."
        )
        
    # Concurrency Fix: Returns a boolean success indicator on atomic single-row drops
    deleted_successfully = remove_workspace_record(workspace_id)
    if not deleted_successfully:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Targeted workspace reference not found."
        )
        
    try:
        # Layout Logic Fix: Safely clean out underlying database directly using naming rule mapping
        cleaned_id = "".join(c if c.isalnum() or c in ["-", "_"] else "_" for c in workspace_id)
        if len(cleaned_id) < 3:
            cleaned_id = "ws_" + cleaned_id
        collection_name = cleaned_id[:63]
        
        # Verify collection existence before executing drop actions to prevent phantom creation side-effects
        existing_collections = [c.name for c in chroma_client.list_collections()]
        if collection_name in existing_collections:
            chroma_client.delete_collection(name=collection_name)
            
    except Exception as e:
        print(f"Error purging underlying vector Chroma collection: {e}")
        
    log_audit_event(
        username, 
        "WORKSPACE_DELETED", 
        workspace_id, 
        f"Deleted workspace ID {workspace_id}"
    )
    return {"message": "Workspace deleted successfully"}
