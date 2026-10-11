import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.config import settings
from backend.services.parser import parse_document
from backend.services.embeddings import embedding_service
from backend.services.rag import get_workspace_collection

router = APIRouter(prefix="/api/documents", tags=["documents"])

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    chunks = []
    if len(text) <= chunk_size:
        return [text] if text.strip() else []
        
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end >= len(text):
            chunks.append(text[start:])
            break
            
        chunk = text[start:end]
        last_newline = chunk.rfind("\n")
        last_period = chunk.rfind(". ")
        last_space = chunk.rfind(" ")
        
        if last_newline > chunk_size // 2:
            split_at = last_newline
        elif last_period > chunk_size // 2:
            split_at = last_period + 1
        elif last_space > chunk_size // 2:
            split_at = last_space
        else:
            split_at = chunk_size
            
        chunks.append(text[start:start+split_at])
        start += split_at - overlap
        if start < 0 or split_at <= overlap:
            start = start + chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    workspace_id: str = Form("default")
):
    ws_upload_dir = os.path.join(settings.UPLOAD_DIR, workspace_id)
    os.makedirs(ws_upload_dir, exist_ok=True)
    
    file_path = os.path.join(ws_upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parsed_pages = parse_document(file_path)
        collection = get_workspace_collection(workspace_id)
        
        all_chunks = []
        all_metadatas = []
        all_ids = []
        
        for item in parsed_pages:
            page_text = item["text"]
            page_meta = item["metadata"]
            page_meta["filename"] = file.filename
            
            chunks = chunk_text(page_text, chunk_size=settings.CHUNK_SIZE, overlap=settings.CHUNK_OVERLAP)
            for idx, chunk_content in enumerate(chunks):
                chunk_id = f"{file.filename}_{page_meta.get('page', 1)}_chunk_{idx}"
                all_chunks.append(chunk_content)
                all_metadatas.append(page_meta.copy())
                all_ids.append(chunk_id)
                
        if not all_chunks:
            return {"filename": file.filename, "message": "No text extracted from document", "chunks_count": 0}
            
        embeddings = embedding_service.get_embeddings(all_chunks)
        
        collection.add(
            ids=all_ids,
            embeddings=embeddings,
            metadatas=all_metadatas,
            documents=all_chunks
        )
        
        return {
            "filename": file.filename,
            "chunks_count": len(all_chunks),
            "status": "success",
            "message": f"Successfully parsed and indexed {len(all_chunks)} chunks."
        }
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error parsing document: {str(e)}")

@router.get("/{workspace_id}")
def list_documents(workspace_id: str):
    """Lists all unique documents indexed in this workspace collection."""
    try:
        collection = get_workspace_collection(workspace_id)
        data = collection.get(include=["metadatas"])
        
        if not data or "metadatas" not in data or not data["metadatas"]:
            return []
            
        unique_files = {}
        for meta in data["metadatas"]:
            filename = meta.get("filename")
            if filename and filename not in unique_files:
                unique_files[filename] = {
                    "filename": filename,
                    "type": meta.get("type", "unknown"),
                    "page_count": 1
                }
            elif filename:
                page = meta.get("page")
                if isinstance(page, int) and page > unique_files[filename]["page_count"]:
                    unique_files[filename]["page_count"] = page
                    
        return list(unique_files.values())
    except Exception as e:
        print(f"Error listing documents: {e}")
        return []

@router.delete("/{workspace_id}/{filename}")
def delete_document(workspace_id: str, filename: str):
    """Deletes all chunks of a document in the vector store and the source file."""
    try:
        collection = get_workspace_collection(workspace_id)
        collection.delete(where={"filename": filename})
        
        file_path = os.path.join(settings.UPLOAD_DIR, workspace_id, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"message": f"Document {filename} deleted successfully from {workspace_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
