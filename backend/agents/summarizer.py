from agents.llm import llm


def summarize_context(question: str, docs: list) -> str:
    if not docs:
        return "I could not find relevant content in the uploaded paper. Try rephrasing your question."

    context_parts = []
    for i, doc in enumerate(docs, 1):
        page = doc.metadata.get("page", "?")
        if isinstance(page, int):
            page += 1
        context_parts.append(f"[Source {i} — Page {page}]\n{doc.page_content}")

    context = "\n\n".join(context_parts)

    prompt = f"""You are ResearchForge, an expert AI research assistant.

Answer the question clearly using ONLY the context below.
After each key fact, cite the page number like (Page 3).
Use bullet points for lists. Be specific and technical.
If the context lacks enough information, say so honestly.

Context:
{context}

Question: {question}

Answer:"""

    response = llm.invoke(prompt)
    return response.content


def auto_summarize(docs: list, pdf_name: str) -> dict:
    if not docs:
        return {"summary": "Could not extract content.", "key_findings": [], "suggested_questions": []}

    context = "\n\n".join([
        f"[Page {doc.metadata.get('page', '?')}]\n{doc.page_content}"
        for doc in docs[:8]
    ])

    prompt = f"""You are ResearchForge. A user just uploaded a research paper called "{pdf_name}".

Analyze this paper and respond in this EXACT format:

SUMMARY:
[2-3 sentence overview of what this paper is about and its main contribution]

KEY_FINDINGS:
- [finding 1 with page number]
- [finding 2 with page number]
- [finding 3 with page number]
- [finding 4 with page number]

SUGGESTED_QUESTIONS:
- [question a researcher would ask]
- [question about methodology]
- [question about results]
- [question about limitations]

Paper content:
{context}"""

    response = llm.invoke(prompt)
    return _parse_auto_summary(response.content)


def _parse_auto_summary(text: str) -> dict:
    result = {"summary": "", "key_findings": [], "suggested_questions": []}
    current = None
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("SUMMARY:"):
            current = "summary"
            rest = line[8:].strip()
            if rest:
                result["summary"] = rest
        elif line.startswith("KEY_FINDINGS:"):
            current = "findings"
        elif line.startswith("SUGGESTED_QUESTIONS:"):
            current = "questions"
        elif line.startswith("- ") and current == "findings":
            result["key_findings"].append(line[2:])
        elif line.startswith("- ") and current == "questions":
            result["suggested_questions"].append(line[2:])
        elif current == "summary" and line and not line.endswith(":"):
            result["summary"] += " " + line
    result["summary"] = result["summary"].strip()
    return result
