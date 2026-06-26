from agents.llm import llm

def find_research_gaps(context):

    prompt = f"""
You are a senior researcher.

Analyze the following literature.

Identify:

1. Limitations
2. Missing areas
3. Unexplored opportunities
4. Future work suggestions

Literature:
{context}
"""

    response = llm.invoke(prompt)

    return response.content