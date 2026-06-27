from agents.llm import llm


def find_research_gaps(docs: list, pdf_name: str) -> str:
    context = "\n\n".join([
        f"[Page {doc.metadata.get('page', '?')}]\n{doc.page_content}"
        for doc in docs[:8]
    ])

    prompt = f"""You are ResearchForge, acting as a senior research critic reviewing "{pdf_name}".

Analyze this paper and identify:

## Limitations Acknowledged by Authors
## Unstated Limitations
## Research Gaps
## Unexplored Opportunities
## Suggested Future Work
## Hypothesis for Follow-up Study

Paper content:
{context}

Be specific, critical, and technically rigorous."""

    response = llm.invoke(prompt)
    return response.content
