from rag.ingest import ingest_pdf

chunks = ingest_pdf([
    "../test_papers/paper1.pdf"
])

print(f"Successfully created {chunks} chunks")