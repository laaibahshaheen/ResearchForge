from rag.retrieve import retrieve_docs

query = input("Ask a question: ")

docs = retrieve_docs(query)

print("\nRetrieved Documents:\n")

for i, doc in enumerate(docs, 1):
    print(f"\n--- Document {i} ---\n")
    print(doc.page_content[:1000])
    