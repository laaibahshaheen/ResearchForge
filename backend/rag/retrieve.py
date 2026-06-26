from langchain_chroma import Chroma
from rag.embeddings import get_embeddings
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "vectorstore")


def retrieve_docs(query: str, k: int = 3):
    if not os.path.exists(VECTORSTORE_PATH):
        raise FileNotFoundError(
            "No vector store found. Please upload a PDF first."
        )

    db = Chroma(
        persist_directory=VECTORSTORE_PATH,
        embedding_function=get_embeddings(),
    )
    docs = db.similarity_search(query, k=k)
    return docs