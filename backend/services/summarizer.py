from backend.services.rag import get_workspace_collection, generate_answer_with_llm

def summarize_document(workspace_id: str, filename: str) -> dict:
    """Generates an executive summary and key takeaways for a document in a workspace."""
    try:
        collection = get_workspace_collection(workspace_id)
        data = collection.get(where={"filename": filename}, include=["documents", "metadatas"])
        
        if not data or "documents" not in data or not data["documents"]:
            return {
                "filename": filename,
                "workspace_id": workspace_id,
                "summary": f"Could not find document content for {filename}.",
                "key_takeaways": [],
                "topics": []
            }
            
        full_text = "\n\n".join([doc for doc in data["documents"] if doc])
        # Truncate text if extremely large to fit model context
        sample_text = full_text[:8000].rsplit(' ', 1)[0] if len(full_text) > 8000 else full_text
        
        prompt = f"""You are an expert Executive Document Analyst. Analyze the following document and generate a structured summary.

DOCUMENT FILENAME: {filename}
DOCUMENT CONTENT:
{sample_text}

Provide your response in the following format:
**Executive Summary:**
<Write a 2-3 sentence overview>

**Key Takeaways:**
- <Takeaway 1>
- <Takeaway 2>
- <Takeaway 3>

**Core Topics:**
<Topic 1>, <Topic 2>, <Topic 3>
"""
        raw_response = generate_answer_with_llm(prompt)
        
        # Parse takeaways and topics
        takeaways = []
        topics = []
        summary_lines = []
        
        in_takeaways = False
        in_topics = False
        
        for line in raw_response.split("\n"):
            line_str = line.strip()
            if "Key Takeaways:" in line_str:
                in_takeaways = True
                in_topics = False
                continue
            elif "Core Topics:" in line_str:
                in_topics = True
                in_takeaways = False
                continue
            elif "Executive Summary:" in line_str:
                in_takeaways = False
                in_topics = False
                continue
                
            if in_takeaways and line_str.startswith("-"):
                takeaways.append(line_str.lstrip("- ").strip())
            elif in_topics and line_str:
                topics.extend([t.strip() for t in line_str.split(",") if t.strip()])
            elif not in_takeaways and not in_topics and line_str:
                summary_lines.append(line_str)
                
        summary_text = " ".join(summary_lines).replace("**Executive Summary:**", "").strip()
        if not summary_text:
            summary_text = raw_response
            
        return {
            "filename": filename,
            "workspace_id": workspace_id,
            "summary": summary_text,
            "key_takeaways": takeaways if takeaways else ["Comprehensive analysis available in original document."],
            "topics": topics if topics else [filename.split(".")[-1].upper(), "Document Analysis"]
        }
    except Exception as e:
        print(f"Error summarizing document {filename}: {e}")
        return {
            "filename": filename,
            "workspace_id": workspace_id,
            "summary": f"Failed to generate summary: {str(e)}",
            "key_takeaways": [],
            "topics": []
        }
