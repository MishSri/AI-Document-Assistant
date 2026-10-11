import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.routes.workspaces import router as workspaces_router
from backend.routes.upload import router as upload_router
from backend.routes.chat import router as chat_router
from backend.routes.auth import router as auth_router
from backend.routes.audit import router as audit_router
from backend.routes.summary import router as summary_router
from backend.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspaces_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(summary_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "ollama_host": settings.OLLAMA_HOST
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
