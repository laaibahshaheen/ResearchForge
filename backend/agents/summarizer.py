from agents.llm import llm


def summarize_context(question, docs):
    # Build context with page numbers from metadata
    context_parts = []
    for i, doc in enumerate(docs):
        page = doc.metadata.get("page", i)
        page_num = int(page) + 1  # PyPDFLoader uses 0-based page index
        context_parts.append(f"[Page {page_num}]\n{doc.page_content}")

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are an expert AI research assistant helping analyze scientific papers.

Answer the question below using ONLY the context provided.
Be precise, structured, and intelligent. Think like a senior researcher.

Rules:
- Always cite the page number when referencing information, like (Page 2)
- If the question asks for a summary, use bullet points for key findings
- If the question asks about methodology, explain it clearly and technically
- If the question asks about results, be specific with numbers and findings
- If the answer is not in the context, say: "This information is not available in the uploaded paper."
- Never make up information

Context from paper:
{context}

Question: {question}

Answer:"""

    response = llm.invoke(prompt)
    return response.content
