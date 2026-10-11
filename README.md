# Enterprise Document Intelligence Assistant
### AI-Powered Document Question Answering Using Retrieval-Augmented Generation (RAG)

An AI-powered document intelligence application that enables users to upload documents, retrieve relevant information through semantic search, and ask questions in natural language.

The application uses **Retrieval-Augmented Generation (RAG)** to provide context-aware answers grounded in uploaded documents, making it useful for enterprise knowledge management, document analysis, and information retrieval.

---

## Overview

Organizations often store large amounts of information in PDFs, reports, and other documents. Finding specific information manually can be time-consuming and inefficient.

The Enterprise Document Intelligence Assistant addresses this problem by combining document processing, vector-based semantic retrieval, and Large Language Models (LLMs) into a unified application.

Users can upload documents, ask questions about their contents, and obtain AI-generated responses based on relevant document context.

## Key Features

- **Document Upload:** Upload supported documents through a web interface.
- **Document Processing:** Extract text from documents and prepare it for retrieval.
- **Intelligent Chunking:** Divide extracted text into smaller sections to improve retrieval relevance.
- **Semantic Search:** Retrieve relevant document passages using embeddings and vector similarity.
- **Context-Aware Q&A:** Generate answers using retrieved document content and an LLM.
- **Document Summarization:** Generate concise summaries of documents.
- **Interactive Web Interface:** Access document intelligence features through a React-based frontend.
- **REST API:** Communicate with the backend through FastAPI endpoints.
- **Role-Based Access:** Support for application roles, including Admin, Member, and Auditor.
- **Audit Logging:** An interface for reviewing application audit records.
- **LLM Fallback:** A local Llama-based fallback is available in the application when the primary generative AI API fails.

> Note: The availability of individual features depends on the current implementation and configuration.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Frontend Build Tool | Vite |
| Styling | CSS / Tailwind CSS, as configured |
| Backend | Python, FastAPI |
| API Communication | REST API |
| Document Processing | PyMuPDF and Python document-processing libraries, as configured |
| Vector Database | ChromaDB |
| Retrieval Method | Embedding-based semantic similarity search |
| Generative AI | Google Generative AI API |
| Fallback Model | Local Llama-based model |
| Data Validation | Pydantic |
| Version Control | Git and GitHub |



---

## System Architecture

The application follows a frontend-backend architecture with a RAG pipeline.

```text
                 ┌──────────────────────────┐
                 │       User Interface     │
                 │       React + Vite       │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │       FastAPI Backend    │
                 │   Request Processing     │
                 └────────────┬─────────────┘
                              │
                 ┌────────────▼─────────────┐
                 │    Document Processing   │
                 │   Text Extraction        │
                 │   Chunking               │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │    Embedding Generation  │
                 │    Vector Representation │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      ChromaDB            │
                 │      Vector Storage      │
                 └────────────┬─────────────┘
                              │
                    User Question
                              │
                              ▼
                 ┌──────────────────────────┐
                 │    Semantic Retrieval    │
                 │    Relevant Chunks       │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      LLM Generation      │
                 │  Answer Using Context    │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │   Response to Frontend   │
                 └──────────────────────────┘
```

### How RAG Works

The application uses the following workflow:

1. **Ingestion:** A user uploads a document.
2. **Text Extraction:** The backend extracts readable text from the document.
3. **Chunking:** The extracted text is divided into smaller passages.
4. **Embedding:** Text passages are converted into vector representations using an embedding model.
5. **Indexing:** The vectors and associated document information are stored in ChromaDB.
6. **Retrieval:** When a user asks a question, the system retrieves relevant passages using vector similarity.
7. **Augmentation:** Retrieved passages are included as context for the language model.
8. **Generation:** The language model generates a response using the supplied context.
9. **Response:** The generated answer is returned to the frontend.

This approach allows the application to answer questions about private or domain-specific documents without requiring a language model to have memorized their contents during training.

---

## Project Structure

The project is organized into separate frontend and backend components.

```text
Document Assistant Project/
├── backend/
│   ├── database/
│   │   └── db.py
│   ├── models/
│   │   └── schemas.py
│   ├── routes/
│   │   ├── audit.py
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── summary.py
│   │   ├── upload.py
│   │   └── workspaces.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── embeddings.py
│   │   ├── parser.py
│   │   ├── rag.py
│   │   └── summarizer.py
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AuditLogModal.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── DocumentSummaryModal.jsx
│   │   │   └── DocumentUpload.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

The structure above is illustrative. Adjust it to match your actual repository, including the location of `requirements.txt`, environment files, and frontend source code.

---

## Getting Started

Follow these instructions to run the application locally.

### Prerequisites

Install the following software before proceeding:

- Python
- Node.js and npm
- Git
- A compatible generative AI API key, if using the external LLM provider

A local Llama-based fallback may require additional model files, dependencies, and system resources.

### 1. Clone the Repository

```bash
git clone <https://github.com/MishSri/AI-Document-Assistant.git>
cd "Document Assistant Project"
```


### 2. Set Up the Python Environment

Create a virtual environment in the project root if one does not already exist.

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

If you are using Command Prompt instead:

```bat
.venv\Scripts\activate.bat
```

### 3. Install Backend Dependencies

Navigate to the directory containing your backend dependency file.


```bash
python -m pip install -r backend/requirements.txt
```


### 4. Configure Environment Variables

Create a `.env` file in the location expected by your backend.

For example:

```env
GOOGLE_API_KEY=your_api_key_here
```

Use the exact environment-variable name expected by your application. The name above is illustrative.

Never commit API keys, passwords, access tokens, or other secrets to GitHub.

### 5. Start the Backend

From the project root, with the virtual environment activated:

```bash
python -m fastapi dev backend/app.py
```
The backend should become available at the local address reported in the terminal, commonly:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is commonly available at:

```text
http://127.0.0.1:8000/docs
```

### 6. Start the Frontend

Open another terminal and navigate to the frontend directory.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

Ensure the frontend API configuration points to the running backend. For example:

```javascript
const API_BASE = "http://localhost:8000/api";
```

Use the API base URL and route prefix configured in your actual application.

---

## API Overview

The frontend communicates with the backend through HTTP requests.

The following are conceptual examples of common RAG API operations:

| Operation | HTTP Method | Purpose |
|---|---|---|
| Upload Document | POST | Upload a document for processing |
| Ask a Question | POST | Submit a question and retrieve an answer |
| List Documents | GET | Retrieve available document information |

The actual endpoint paths, request schemas, and response formats depend on the current backend implementation.

---

## Security Considerations

Since the application is designed for document intelligence, protecting uploaded data and user accounts is important.

Recommended security practices include:

- Store API keys and secrets in environment variables.
- Validate uploaded files and restrict supported file types.
- Enforce authentication and authorization on protected endpoints.
- Ensure users cannot retrieve documents they are not authorized to access.
- Apply appropriate file-size and request limits.
- Avoid exposing sensitive document content in application logs.
- Validate and sanitize user inputs.
- Configure production CORS policies appropriately.
- Protect audit records against unauthorized access or modification.

**Important:** Role-based interfaces alone do not guarantee secure access control. Backend authorization must be enforced on every protected operation.

---

## Limitations

Like other RAG applications, this system has several limitations:

- Answer quality depends on the quality of extracted text and retrieved passages.
- Poorly structured documents may reduce retrieval accuracy.
- Semantic similarity does not guarantee that retrieved passages contain the correct answer.
- LLM-generated answers can contain inaccuracies or unsupported claims.
- Model API availability, rate limits, and usage costs may affect response generation.
- Local fallback models may require additional memory and computational resources.
- Document isolation and multi-user security depend on the backend's actual implementation.

RAG can help ground responses in document content, but it does not eliminate hallucinations.

---

## Future Improvements

Potential improvements to the application include:

- Source citations with document names and page numbers.
- Improved retrieval through hybrid search and reranking.
- Automated evaluation of retrieval quality and answer correctness.
- Document-level permissions and stronger tenant isolation.
- Persistent conversation history.
- Support for additional document formats.
- OCR for scanned documents.
- Document comparison and cross-document analysis.
- Docker-based deployment and automated testing.
- Monitoring, usage analytics, and performance optimization.

These are potential enhancements rather than claims about currently implemented functionality.

---

## Use Cases

The application can be adapted for:

- Enterprise knowledge management.
- Internal policy and documentation search.
- Research paper exploration.
- Technical documentation assistance.
- Report analysis and summarization.
- Question answering over organizational documents.

Actual suitability depends on document access controls, answer quality, and the application's deployment configuration.

---

## Learning Outcomes

This project provides practical experience with:

- Retrieval-Augmented Generation (RAG).
- Embeddings and vector similarity search.
- Document ingestion and text processing.
- Vector database integration.
- LLM-powered question answering.
- REST API development using FastAPI.
- React frontend and Python backend integration.
- Error handling and fallback model integration.
- Role-based application design.

---

## Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request describing the changes.

---

## License


If no license has been selected, the repository's default copyright protections apply.

---

## Author

**Srijan Mishra**

Computer Engineering  
IIIT Bhubaneswar

GitHub: [MishSri](https://github.com/MishSri)

---

*Built to explore practical applications of Retrieval-Augmented Generation, semantic search, and AI-powered document intelligence.*