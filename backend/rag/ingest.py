from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from rag.embeddings import get_embeddings
import shutil
import os
import chromadb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "vectorstore")


def ingest_pdf(pdf_path: str):
    # Reset any open ChromaDB client before deleting the folder
    if os.path.exists(VECTORSTORE_PATH):
        try:
            client = chromadb.PersistentClient(path=VECTORSTORE_PATH)
            for col in client.list_collections():
                client.delete_collection(col.name)
            del client
        except Exception:
            pass
        shutil.rmtree(VECTORSTORE_PATH)

    print(f"Loading PDF: {pdf_path}")
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    print(f"Loaded {len(docs)} pages")

    docs = [doc for doc in docs if doc.page_content.strip()]
    if not docs:
        raise ValueError(
            "This PDF has no extractable text. It may be a scanned image. "
            "Please upload a text-based PDF."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks")

    if not chunks:
        raise ValueError(
            "PDF was loaded but produced no text chunks. "
            "The file may be corrupted or contain only images."
        )

    Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        persist_directory=VECTORSTORE_PATH,
    )
    print("Vector store saved successfully!")
    return len(chunks)
