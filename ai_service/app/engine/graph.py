from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.engine.state import PipelineState
from app.engine.steps.generate import node_generate
from app.engine.steps.judge import node_judge
from app.engine.steps.refine import node_collect, node_refine, should_refine
from app.engine.steps.solve import node_solve


def build_graph():
    g = StateGraph(PipelineState)
    g.add_node("generate", node_generate)
    g.add_node("solve", node_solve)
    g.add_node("judge", node_judge)
    g.add_node("refine", node_refine)
    g.add_node("collect", node_collect)
    g.set_entry_point("generate")
    g.add_edge("generate", "solve")
    g.add_edge("solve", "judge")
    g.add_conditional_edges("judge", should_refine,
                            {"refine": "refine", "collect": "collect"})
    g.add_edge("refine", "generate")
    g.add_edge("collect", END)
    return g.compile()
