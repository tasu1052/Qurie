from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.pipeline.nodes.generate import node_generate
from app.pipeline.nodes.judge import node_judge
from app.pipeline.nodes.refine import node_refine, should_refine
from app.pipeline.nodes.solve import node_solve
from app.pipeline.state import PipelineState


def build_graph():
    g = StateGraph(dict)  # TypedDict를 dict로 써도 동작
    g.add_node("generate", node_generate)
    g.add_node("solve", node_solve)
    g.add_node("judge", node_judge)
    g.add_node("refine", node_refine)
    g.set_entry_point("generate")
    g.add_edge("generate", "solve")
    g.add_edge("solve", "judge")
    g.add_conditional_edges("judge", should_refine, {"refine": "refine", "end": END})
    g.add_edge("refine", "generate")
    return g.compile()


PIPELINE = build_graph()


def run_pipeline(initial: dict) -> dict:
    return PIPELINE.invoke(initial)