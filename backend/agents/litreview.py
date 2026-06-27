from agents.llm import llm


def generate_literature_review(docs_per_paper: dict) -> str:
    if not docs_per_paper:
        return "No papers provided for literature review."

    sections = []
    for name, docs in docs_per_paper.items():
        text = "\n".join([d.page_content for d in docs[:4]])
        sections.append(f"=== {name} ===\n{text}")

    combined = "\n\n".join(sections)
    paper_list = ", ".join(docs_per_paper.keys())

    prompt = f"""You are ResearchForge. Generate a professional academic literature review.

Papers analyzed: {paper_list}

Content:
{combined}

Write a structured literature review:

## Introduction
## Thematic Analysis
## Methodological Comparison
## Key Findings Synthesis
## Contradictions & Debates
## Research Gaps
## Conclusion

Write in formal academic style."""

    response = llm.invoke(prompt)
    return response.content
