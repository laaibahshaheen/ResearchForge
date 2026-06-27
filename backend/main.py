from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil, os

from rag.ingest import ingest_pdf, list_collections, _safe_name
from rag.retrieve import retrieve_docs, retrieve_all_docs
from agents.summarizer import summarize_context, auto_summarize
from agents.comparator import compare_papers
from agents.gapfinder import find_research_gaps
from agents.litreview import generate_literature_review

app = FastAPI(title="ResearchForge API", version="2.0.0")

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

class CompareRequest(BaseModel):
    pdf_name_1: str
    pdf_name_2: str

class GapRequest(BaseModel):
    pdf_name: str

class LitReviewRequest(BaseModel):
    pdf_names: list[str]

@app.get("/health")
def health():
    return {"status": "ok", "service": "researchforge-backend", "version": "2.0.0"}

@app.get("/papers")
def list_papers():
    return {"papers": list_collections()}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        chunk_count = ingest_pdf(file_path, pdf_name=file.filename)
        docs = retrieve_all_docs(file.filename, k=8)
        summary_data = auto_summarize(docs, file.filename)
        return {
            "message": f"{file.filename} uploaded successfully",
            "chunks": chunk_count,
            "pdf_name": _safe_name(file.filename),
            "summary": summary_data["summary"],
            "key_findings": summary_data["key_findings"],
            "suggested_questions": summary_data["suggested_questions"],
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/ask")
def ask(query: Query):
    try:
        docs = retrieve_docs(query.question, pdf_name=query.pdf_name)
        answer = summarize_context(query.question, docs)
        return {"answer": answer}
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(query: Query):
    return ask(query)

@app.post("/compare")
def compare(req: CompareRequest):
    try:
        docs1 = retrieve_all_docs(req.pdf_name_1, k=6)
        docs2 = retrieve_all_docs(req.pdf_name_2, k=6)
        if not docs1:
            raise HTTPException(status_code=404, detail=f"No content found for: {req.pdf_name_1}")
        if not docs2:
            raise HTTPException(status_code=404, detail=f"No content found for: {req.pdf_name_2}")
        result = compare_papers(docs1, docs2, req.pdf_name_1, req.pdf_name_2)
        return {"comparison": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gaps")
def gaps(req: GapRequest):
    try:
        docs = retrieve_all_docs(req.pdf_name, k=8)
        if not docs:
            raise HTTPException(status_code=404, detail=f"No content found for: {req.pdf_name}")
        result = find_research_gaps(docs, req.pdf_name)
        return {"gaps": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/litreview")
def litreview(req: LitReviewRequest):
    try:
        if not req.pdf_names:
            raise HTTPException(status_code=400, detail="Provide at least one paper name.")
        docs_per_paper = {}
        for name in req.pdf_names:
            docs = retrieve_all_docs(name, k=5)
            if docs:
                docs_per_paper[name] = docs
        if not docs_per_paper:
            raise HTTPException(status_code=404, detail="No indexed content found.")
        result = generate_literature_review(docs_per_paper)
        return {"literature_review": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
