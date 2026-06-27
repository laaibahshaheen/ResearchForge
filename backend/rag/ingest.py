from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from rag.embeddings import get_embeddings
import shutil, os, re, chromadb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "vectorstore")


def _safe_name(name: str) -> str:
    name = os.path.splitext(name)[0]
    name = re.sub(r"[^a-zA-Z0-9_-]", "_", name)
    name = name[:60]
    if len(name) < 3:
        name = name + "_pdf"
    return name.lower()


def ingest_pdf(pdf_path: str, pdf_name: str = None):
    collection_name = _safe_name(pdf_name or os.path.basename(pdf_path))
    print(f"Loading PDF: {pdf_path} → collection: {collection_name}")

    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    print(f"Loaded {len(docs)} pages")

    docs = [doc for doc in docs if doc.page_content.strip()]
    if not docs:
        raise ValueError("This PDF has no extractable text. Please upload a text-based PDF.")

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks")

    if not chunks:
        raise ValueError("PDF produced no text chunks. File may be corrupted.")

    for chunk in chunks:
        chunk.metadata["pdf_name"] = collection_name

    try:
        client = chromadb.PersistentClient(path=VECTORSTORE_PATH)
        existing = [c.name for c in client.list_collections()]
        if collection_name in existing:
            client.delete_collection(collection_name)
    except Exception:
        pass

    Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        persist_directory=VECTORSTORE_PATH,
        collection_name=collection_name,
    )
    print(f"Stored {len(chunks)} chunks in '{collection_name}'")
    return len(chunks)


def list_collections() -> list[str]:
    if not os.path.exists(VECTORSTORE_PATH):
        return []
    try:
        client = chromadb.PersistentClient(path=VECTORSTORE_PATH)
        return [c.name for c in client.list_collections()]
    except Exception:
        return []
