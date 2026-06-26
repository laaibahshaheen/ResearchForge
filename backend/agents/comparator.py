from agents.llm import llm

def compare_papers(text1, text2):

    prompt = f"""
Compare these two research papers.

Paper 1:
{text1}

Paper 2:
{text2}

Provide:

1. Similarities
2. Differences
3. Strengths
4. Weaknesses
5. Novel contributions
"""

    response = llm.invoke(prompt)

    return response.content