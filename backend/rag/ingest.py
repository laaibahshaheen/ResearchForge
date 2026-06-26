from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from rag.embeddings import get_embeddings

COLLECTION = "researchforge"
client = QdrantClient(host="localhost", port=6333)

def ingest_pdf(pdf_path: str):
    print(f"Loading PDF: {pdf_path}")
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    print(f"Loaded {len(docs)} pages")

    docs = [doc for doc in docs if doc.page_content.strip()]
    if not docs:
        raise ValueError("This PDF has no extractable text.")

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks")

    if not chunks:
        raise ValueError("PDF produced no text chunks.")

    # Delete and recreate collection — Qdrant handles this cleanly
    if client.collection_exists(COLLECTION):
        client.delete_collection(COLLECTION)
        print("Deleted old collection.")

    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

    QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        url="http://localhost:6333",
        collection_name=COLLECTION,
    )
    print("Qdrant vector store saved!")
    return len(chunks)
