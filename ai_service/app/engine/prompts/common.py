from __future__ import annotations


def number_code(path: str, content: str) -> str:
    lines = content.replace("\r\n", "\n").split("\n")
    body = "\n".join(f"{i+1:>4}| {ln}" for i, ln in enumerate(lines))
    return f"FILE: {path}\n{body}"
