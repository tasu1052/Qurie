from __future__ import annotations

from app.report.dto.request import Attempt, CreateReportRequest, ReportSummary


def _summary_block(s: ReportSummary) -> str:
    lines = [
        f"- 출제 {s.quiz_total_count}문항 중 {s.quiz_attempted_count}문항 응시"
        f" (미응시 {s.quiz_skipped_count}문항)",
        f"- 정답 {s.quiz_correct_count}문항 / 정답률 {s.accuracy:.1f}%",
        f"- 완료율 {s.completion_rate:.1f}% / 문항당 평균 {s.avg_elapsed_ms // 1000}초",
    ]
    if s.difficulty_ratio:
        parts = [f"{k} {v.correct}/{v.attempted}정답(출제 {v.total})"
                 for k, v in s.difficulty_ratio.items()]
        lines.append("- 난이도별: " + ", ".join(parts))
    if s.concept_stats:
        parts = [f"{k} {v.correct}/{v.attempted}정답(출제 {v.total})"
                 for k, v in s.concept_stats.items()]
        lines.append("- 개념별: " + ", ".join(parts))
    return "\n".join(lines)


def _attempt_block(a: Attempt) -> str:
    if a.chosen_index is None:
        picked = "미응시"
    else:
        chosen = a.choices[a.chosen_index] if a.chosen_index < len(a.choices) else "?"
        picked = f"학생 선택: {a.chosen_index}번 \"{chosen}\""
    answer = a.choices[a.answer_index] if a.answer_index < len(a.choices) else "?"
    mark = "정답" if a.is_correct else ("미응시" if a.chosen_index is None else "오답")
    where = f" (근거 {a.file_path} {a.line_start}~{a.line_end}줄)" if a.file_path else ""
    return (
        f"[{a.index}] {mark} · {a.difficulty} · 개념=\"{a.tested_concept}\"{where}\n"
        f"  문항: {a.question}\n"
        f"  정답: {a.answer_index}번 \"{answer}\" / {picked}\n"
        f"  소요: {a.elapsed_ms // 1000}초"
    )


def build_report_prompt(req: CreateReportRequest) -> str:
    attempts = "\n\n".join(_attempt_block(a) for a in req.attempts)
    concepts = sorted({a.tested_concept for a in req.attempts if a.tested_concept})

    return f"""프로그래밍 학습자 1명의 퀴즈 응시 결과를 읽고 학습 리포트를 작성하세요.

[대상] {req.student_name} 님

[집계 — 이미 계산된 사실입니다]
{_summary_block(req.summary)}

[문항별 응시 기록]
{attempts}

[작성 규칙]
1. **숫자를 새로 계산하지 마세요.** 위 집계값을 그대로 인용하세요. 직접 센 수치를 쓰면 화면의 통계와 어긋납니다.
2. 모든 지적과 칭찬에는 **근거를 함께 쓰세요.** "재귀에 약함"이 아니라 "재귀 종료 조건 문항 2개 중 2개 오답"처럼 씁니다.
3. **학생이 직접 읽는 글입니다.** "이해도 낮음", "취약함" 같은 낙인성 표현 대신 "다시 확인하면 좋을 부분"처럼 다음 행동으로 이어지는 표현을 쓰세요.
4. 응시 기록에 **없는 개념을 지어내지 마세요.** 등장한 개념은 다음뿐입니다: {", ".join(concepts) or "(없음)"}
5. 미응시 문항은 오답과 구분하세요. 못 푼 것이 아니라 안 푼 것입니다.
6. 모두 한국어 존댓말로 씁니다.

[항목별 지침]
- comment: 3~5문장 총평. 잘한 점을 먼저, 보완점을 뒤에 둡니다.
- strengths: 정답률이 높았던 영역. 근거(문항 수) 포함.
- improvements: 오답이 몰린 영역과 **구체적인 다음 행동**. "복습하세요"가 아니라 무엇을 어떻게 볼지 씁니다.
- focus_concepts: 위 개념 목록에서만 고르세요. 우선 복습할 순서대로.

emit_report 도구로만 답하세요.
"""
