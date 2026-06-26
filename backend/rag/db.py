# Simple in-memory vector store — no SQLite, no file locks, no permissions issues
# Perfect for single-session demo use
import numpy as np
from rag.embeddings import get_embeddings

_chunks = []  # stores LangChain Document objects
_embeddings = []  # stores numpy arrays

def reset_db():
    global _chunks, _embeddings
    _chunks = []
    _embeddings = []
    print("In-memory store cleared.")

def add_documents(docs):
    global _chunks, _embeddings
    emb_model = get_embeddings()
    texts = [doc.page_content for doc in docs]
    vecs = emb_model.embed_documents(texts)
    _chunks = docs
    _embeddings = np.array(vecs)
    print(f"Stored {len(docs)} chunks in memory.")

def similarity_search(query: str, k: int = 3):
    if not _chunks:
        return []
    emb_model = get_embeddings()
    q_vec = np.array(emb_model.embed_query(query))
    # Cosine similarity
    norms = np.linalg.norm(_embeddings, axis=1) * np.linalg.norm(q_vec)
    sims = _embeddings @ q_vec / np.maximum(norms, 1e-9)
    top_k = np.argsort(sims)[::-1][:k]
    return [_chunks[i] for i in top_k]
