from rag.retrieve import retrieve_docs
from agents.summarizer import summarize_context

question = input("Ask a question: ")

docs = retrieve_docs(question)

answer = summarize_context(question, docs)

print("\nResearchForge Answer:\n")
print(answer)
