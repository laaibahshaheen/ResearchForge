from langchain_chroma import Chroma
from rag.embeddings import get_embeddings
from rag.ingest import _safe_name
import os, chromadb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "vectorstore")


def retrieve_docs(query: str, pdf_name: str = None, k: int = 5):
    if not os.path.exists(VECTORSTORE_PATH):
        raise FileNotFoundError("No papers indexed yet. Please upload a PDF first.")

    client = chromadb.PersistentClient(path=VECTORSTORE_PATH)
    collections = [c.name for c in client.list_collections()]

    if not collections:
        raise FileNotFoundError("No papers indexed yet. Please upload a PDF first.")

    if pdf_name:
        collection_name = _safe_name(pdf_name)
        if collection_name not in collections:
            collection_name = collections[-1]
    else:
        collection_name = collections[-1]

    db = Chroma(
        persist_directory=VECTORSTORE_PATH,
        embedding_function=get_embeddings(),
        collection_name=collection_name,
    )
    return db.similarity_search(query, k=k)


def retrieve_all_docs(pdf_name: str, k: int = 10):
    return retrieve_docs(
        "research methodology findings results conclusion",
        pdf_name=pdf_name,
        k=k
    )
