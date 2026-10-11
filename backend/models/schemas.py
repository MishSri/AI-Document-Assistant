from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# User & Auth Schemas
class UserRole:
    ADMIN = "admin"
    MEMBER = "member"
    AUDITOR = "auditor"

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = UserRole.MEMBER
    department: str = "General"

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    department: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Workspace Schemas
class WorkspaceCreate(BaseModel):
    name: str
    description: str = ""
    department: str = "General"

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: str = ""
    department: str = "General"
    created_at: str

# Document Schemas
class DocumentInfo(BaseModel):
    filename: str
    type: str
    page_count: int = 1
    file_size_bytes: int = 0
    uploaded_at: str = ""
    author: str = "System"

class DocumentSummaryResponse(BaseModel):
    filename: str
    workspace_id: str
    summary: str
    key_takeaways: List[str]
    topics: List[str]

# Chat & Citation Schemas
class ChatQuery(BaseModel):
    question: str
    workspace_id: str = "default"

class Citation(BaseModel):
    index: int
    filename: str
    page: int
    snippet: str

class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    timestamp: str = ""

# Audit Log Schemas
class AuditLogEntry(BaseModel):
    id: str
    username: str
    action: str
    workspace_id: str
    details: str
    timestamp: str
class AuditLogCreate(BaseModel):
    """Pydantic safety wrapper validation rules for incoming payload streams."""
    username: str = Field(..., min_length=1, examples=["admin_user"])
    action: str = Field(..., examples=["WORKSPACE_DOCUMENT_DELETED"])
    workspace_id: str = Field(..., examples=["workspace_9104"])
    details: Optional[str] = Field(None, examples=["Deleted file 'annual_report.pdf'"])

class AuditLogEntry(AuditLogCreate):
    """Outbound API response validation model extending database schemas."""
    id: str = Field(..., examples=["log_01HM7J"])
    created_at: datetime

    class Config:
        from_attributes = True 