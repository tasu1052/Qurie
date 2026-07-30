import os

os.environ["AI_MOCK"] = "1"

from app.engine.purpose import purpose_counts


def test_purpose_counts_practice():
    assert purpose_counts("PRACTICE", 10) == {"conceptual": 7, "micro": 3}


def test_purpose_counts_assessment():
    assert purpose_counts("ASSESSMENT", 10) == {"conceptual": 3, "micro": 7}


def test_purpose_counts_small_n():
    assert purpose_counts("PRACTICE", 7) == {"conceptual": 4, "micro": 3}
    assert sum(purpose_counts("ASSESSMENT", 5).values()) == 5
