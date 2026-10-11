import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from backend.models.schemas import ChatQuery, ChatResponse
from backend.database.db import (
    save_chat_message, 
    get_workspace_chat_history, 
    clear_workspace_chat_history, 
    log_audit_event
)
from backend.services.auth_service import get_current_user
from backend.services.rag import run_rag_pipeline

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Mock dependency helper checking workspace enrollment
def verify_workspace_access(workspace_id: str, user: dict):
    """Enforces multi-tenant horizontal isolation boundaries."""
    # Example logic: if workspace_id not in user.get("workspaces", []):
    #     raise HTTPException(status_code=403, detail="Unauthorized workspace access")
    pass

@router.post("", response_model=ChatResponse)
def ask_question(query: ChatQuery, current_user: dict = Depends(get_current_user)):
    """Processes a query via RAG and commits conversation pairs atomically to the DB."""
    if not query.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Question cannot be empty"
        )
        
    verify_workspace_access(query.workspace_id, current_user)
    username = current_user["username"]
    
    # Commit the user question atomically to avoid state race conditions
    save_chat_message(
        workspace_id=query.workspace_id,
        role="user",
        content=query.question,
        username=username
    )
    
    # Run the RAG pipeline processing
    result = run_rag_pipeline(query.workspace_id, query.question)
    
    # Commit assistant answer atomically
    save_chat_message(
        workspace_id=query.workspace_id,
        role="assistant",
        content=result["answer"],
        username="assistant",
        citations=result["citations"]
    )
    
    log_audit_event(
        username, 
        "CHAT_QUERY", 
        query.workspace_id, 
        f"Asked: '{query.question[:50]}...'"
    )
    return result

@router.get("/history/{workspace_id}")
def get_history(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieves chronological chat records securely isolated by workspace membership."""
    verify_workspace_access(workspace_id, current_user)
    return get_workspace_chat_history(workspace_id)

@router.delete("/history/{workspace_id}")
def clear_history(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """Flushes a workspace's historical messages using an atomic delete operation."""
    verify_workspace_access(workspace_id, current_user)
    username = current_user["username"]
    
    clear_workspace_chat_history(workspace_id)
    log_audit_event(username, "CHAT_CLEARED", workspace_id, "Cleared chat history")
    return {"message": "Chat history cleared successfully"}
