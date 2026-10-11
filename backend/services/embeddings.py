import os
import logging
from backend.config import settings

class EmbeddingService:
    def __init__(self):
        self._local_model = None

    def get_local_model(self):
        if self._local_model is None:
            # Lazy load sentence-transformers to speed up startup if API keys are used
            from sentence_transformers import SentenceTransformer
            self._local_model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._local_model

    def get_embedding(self, text: str) -> list[float]:
        """Generates embedding for a single text string."""
        return self.get_embeddings([text])[0]

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generates embeddings for a list of text strings."""
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.embeddings.create(
                    input=texts,
                    model="text-embedding-3-small"
                )
                return [data.embedding for data in response.data]
            except Exception as e:
                print(f"OpenAI embedding generation failed: {e}. Falling back to local.")
        
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                result = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=texts,
                    task_type="retrieval_document"
                )
                return result["embedding"]
            except Exception as e:
                print(f"Gemini embedding generation failed: {e}. Falling back to local.")
                
        # Default local sentence-transformers
        model = self.get_local_model()
        embeddings = model.encode(texts)
        return [em.tolist() for em in embeddings]

embedding_service = EmbeddingService()
