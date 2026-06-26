from rag.ingest import ingest_pdf

pdfs = [
    "../test_papers/paper1.pdf",
    "../test_papers/paper2.pdf"
]

chunks = ingest_pdf(pdfs)

print(f"Created {chunks} chunks")
