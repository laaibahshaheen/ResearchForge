from langchain_huggingface import HuggingFaceEmbeddings

# Module-level cache — the model loads once and is reused for every
# ingest and retrieval call. Loading it twice wastes ~500MB of RAM
# and adds 10-20 seconds of startup time per request.
_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        print("Loading embedding model (first time only)...")
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        print("Embedding model loaded.")
    return _embeddings
