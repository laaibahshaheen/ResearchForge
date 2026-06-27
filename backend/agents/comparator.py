from agents.llm import llm


def compare_papers(docs1: list, docs2: list, name1: str, name2: str) -> str:
    text1 = "\n".join([d.page_content for d in docs1[:6]])
    text2 = "\n".join([d.page_content for d in docs2[:6]])

    prompt = f"""You are ResearchForge, an expert research analyst.

Compare these two research papers in depth.

Paper 1: {name1}
{text1}

Paper 2: {name2}
{text2}

Provide a structured comparison:

## Objectives
## Methodology
## Key Results
## Strengths & Weaknesses
## Novel Contributions
## Which to cite for what

Be specific and cite page numbers where possible."""

    response = llm.invoke(prompt)
    return response.content
