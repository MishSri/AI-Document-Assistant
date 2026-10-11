import os
import httpx
from backend.config import settings
from backend.services.embeddings import embedding_service
import chromadb
import google.generativeai as genai
from openai import OpenAI

# Initialize Chroma client
oprnai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
chroma_client = chromadb.PersistentClient(path=settings.DB_DIR)

def get_workspace_collection(workspace_id: str):
    # Chroma collection names must conform to 3-63 character rules, alphanumeric + _ or -
    cleaned_id = "".join(c if c.isalnum() or c in ["-", "_"] else "_" for c in workspace_id)
    if len(cleaned_id) < 3:
        cleaned_id = "ws_" + cleaned_id
    cleaned_id = cleaned_id[:63]
    return chroma_client.get_or_create_collection(name=cleaned_id)

def query_vector_db(workspace_id: str, query_text: str, n_results: int = 5):
    """Retrieves top N matching chunks from the workspace's Chroma collection."""
    try:
        collection = get_workspace_collection(workspace_id)
        if collection.count() == 0:
            return []
            
        query_vector = embedding_service.get_embedding(query_text)
        
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=n_results
        )
        
        chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metadatas = results["metadatas"][0]
            ids = results["ids"][0]
            distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)
            
            for doc, meta, cid, dist in zip(docs, metadatas, ids, distances):
                chunks.append({
                    "id": cid,
                    "text": doc,
                    "metadata": meta,
                    "distance": float(dist)
                })
        return chunks
    except Exception as e:
        print(f"Error querying vector DB: {e}")
        return []

def call_openai(prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    return response.choices[0].message.content

def call_gemini(prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    model = genai.GenerativeModel("models/gemini-3.5-flash")
    response = model.generate_content(prompt)
    return response.text

def call_ollama(prompt: str) -> str:
    url = f"{settings.OLLAMA_HOST}/api/generate"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.0
        }
    }
    response = httpx.post(url, json=payload, timeout=60.0)
    response.raise_for_status()
    return response.json().get("response", "")

def generate_answer_with_llm(prompt: str) -> str:
    if settings.OPENAI_API_KEY:
        try:
            return call_openai(prompt)
        except Exception as e:
            print(f"OpenAI completion failed: {e}")
            
    if settings.GEMINI_API_KEY:
        try:
            return call_gemini(prompt)
        except Exception as e:
            print(f"Gemini completion failed: {e}")
            
    try:
        return call_ollama(prompt)
    except Exception as e:
        print(f"Ollama completion failed: {e}")
        
    return (
        "**[System Note: Running in Sandbox Mock Mode. To enable full AI answers, "
        "please configure a `GEMINI_API_KEY` or `OPENAI_API_KEY` in your `.env` file, "
        "or ensure Ollama is running locally on `http://localhost:11434`.]**\n\n"
        "Here is the context I retrieved to answer your question:\n\n"
        "*(See the 'Sources' drawer below for full details)*"
    )

def run_rag_pipeline(workspace_id: str, question: str):
    """Executes the complete retrieval-augmented generation pipeline."""
    chunks = query_vector_db(workspace_id, question, n_results=5)
    
    if not chunks:
        return {
            "answer": "No documents have been uploaded to this workspace yet. Please upload documents in the sidebar to start asking questions.",
            "citations": []
        }
        
    context_str = ""
    citations = []
    
    for i, chunk in enumerate(chunks):
        meta = chunk["metadata"]
        filename = meta.get("filename", "Unknown Document")
        page = meta.get("page", 1)
        text = chunk["text"]
        
        context_str += f"Source [{i+1}]: {filename} (Page/Slide: {page})\nContent:\n{text}\n\n"
        citations.append({
            "index": i + 1,
            "filename": filename,
            "page": page,
            "snippet": text[:200] + "..." if len(text) > 200 else text
        })
        
    prompt = f"""You are an advanced Document Assistant. Answer the user's question clearly and accurately, basing your answer ONLY on the provided document context. 

If the context does not contain the answer, state that you cannot find the answer in the provided documents.
When answering, refer to the sources using bracketed numbers (e.g., [1], [2]) to cite where the information came from.

---
DOCUMENT CONTEXT:
{context_str}
---

QUESTION:
{question}

ANSWER:"""

    answer = generate_answer_with_llm(prompt)
    
    # If in sandbox mode, append snippet info directly to the answer so the user can still see what was retrieved
    if "System Note: Running in Sandbox Mock Mode" in answer:
        snippet_summary = "\n\n".join(
            f"**Source [{c['index']}]: {c['filename']} (Page/Slide: {c['page']})**\n> {c['snippet']}"
            for c in citations
        )
        answer += f"\n\n{snippet_summary}"
        
    return {
        "answer": answer,
        "citations": citations
    }
