# ResearchForge

> An autonomous AI research assistant that reads, compares, and synthesizes scientific papers.

Built for Confluence 2.0 Hackathon by a first-year Biomedical Engineering student.

---

## What it does

| Feature | Description |
|---|---|
| **Smart Upload** | Upload any research PDF → auto-chunked, embedded, indexed |
| **Cited Q&A** | Ask questions → grounded answers with page citations |
| **Paper Comparison** | Upload 2 papers → AI compares objectives, methods, results |
| **Gap Analysis** | Identifies limitations, research gaps, and proposes hypotheses |
| **Literature Review** | Auto-generates academic lit review from multiple papers |

## Demo

1. Upload `AI_Integrated_Smart_Bandage_IEEE_Paper.pdf`
2. Ask: *"What is the main contribution of this paper?"*
3. Switch to **Gap Analysis** → see research gaps + future hypothesis
4. Upload a second paper → use **Compare** tab

---

## Architecture 
PDF Upload

↓

PyPDF Loader → Text Chunks (1000 tokens, 200 overlap)

↓

HuggingFace MiniLM-L6-v2 Embeddings

↓

ChromaDB Vector Store (per-PDF collections)

↓

Semantic Retrieval (top-5 chunks)

↓

LLaMA 3.3 70B via Groq API

↓

Cited Answer / Comparison / Gap Analysis / Lit Review
## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Bauhaus earth-tone design |
| Backend | FastAPI + Python 3.14 |
| LLM | LLaMA 3.3 70B via Groq (free tier) |
| Vector DB | ChromaDB with per-PDF collections |
| Embeddings | HuggingFace all-MiniLM-L6-v2 |
| Framework | LangChain + LangGraph |

## Setup

```bash
# 1. Backend
cd backend
source .venv/bin/activate
uvicorn main:app --port 8000

# 2. Frontend
cd frontend
npm run dev
```

Add to `backend/.env`:
## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/papers` | GET | List indexed papers |
| `/upload` | POST | Upload + index PDF |
| `/ask` | POST | Q&A with citations |
| `/compare` | POST | Compare two papers |
| `/gaps` | POST | Research gap analysis |
| `/litreview` | POST | Literature review |

---

Built with FastAPI · LangChain · Groq · React · ChromaDB
