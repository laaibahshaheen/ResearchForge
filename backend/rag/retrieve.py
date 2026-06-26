from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from rag.embeddings import get_embeddings

COLLECTION = "researchforge"
client = QdrantClient(host="localhost", port=6333)

def retrieve_docs(query: str, k: int = 3):
    if not client.collection_exists(COLLECTION):
        raise FileNotFoundError("No PDF uploaded yet. Please upload a PDF first.")

    db = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION,
        embedding=get_embeddings(),
    )
    return db.similarity_search(query, k=k)
