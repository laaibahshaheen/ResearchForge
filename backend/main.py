from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os

from rag.ingest import ingest_pdf
from rag.retrieve import retrieve_docs
from agents.summarizer import summarize_context

app = FastAPI(
    title="ResearchForge API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)


class Query(BaseModel):
    question: str
    pdf_name: str | None = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "researchforge-backend"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        chunk_count = ingest_pdf(file_path)
        return {
            "message": f"{file.filename} uploaded successfully",
            "chunks": chunk_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.post("/chat")
def chat(query: Query):
    try:
        docs = retrieve_docs(query.question)
        answer = summarize_context(query.question, docs)
        return {"answer": answer}
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask")
def ask(query: Query):
    try:
        docs = retrieve_docs(query.question)
        answer = summarize_context(query.question, docs)
        return {"answer": answer}
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))