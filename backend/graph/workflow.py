from langgraph.graph import StateGraph
from typing import TypedDict

class GraphState(TypedDict):
    question: str
    answer: str

def summarize_node(state):
    return state

builder = StateGraph(GraphState)

builder.add_node("summarize", summarize_node)

builder.set_entry_point("summarize")

builder.set_finish_point("summarize")

graph = builder.compile()