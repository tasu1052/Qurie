from __future__ import annotations

from dataclasses import dataclass, field

from app.core import config
from app.report.dto.request import Attempt, CreateReportRequest, ReportSummary


@dataclass
class ReportPlan:
    """무엇을 몇 개 쓸지 코드가 먼저 정한다.

    "반 평균을 고려해서 쓰세요" 같은 지시는 준수 여부를 검증할 수 없고 실제로 자주
    무시됐다. 어느 문항에 대해 쓸지를 목록으로 못박으면 지켰는지 코드가 확인할 수 있다.
    """

    praise: list[int] = field(default_factory=list)       # 반 대부분이 틀린 걸 맞힘
    priority: list[int] = field(default_factory=list)     # 반 대부분이 맞힌 걸 틀림
    common_wrong: list[int] = field(default_factory=list)  # 다 같이 어려워함
    wrong: list[int] = field(default_factory=list)        # 오답 전체
    unanswered: list[int] = field(default_factory=list)

    @property
    def improvement_targets(self) -> list[int]:
        """우선 확인 → 나머지 오답 → 미응시 순."""
        rest = [i for i in self.wrong if i not in self.priority]
        return (self.priority + rest + self.unanswered)[:4]

    @property
    def cohort_shown(self) -> set[int]:
        """반 평균을 프롬프트에 노출할 문항.

        판정 대상이 아닌 문항의 수치까지 보여주면 모델이 그걸 끌어다 쓴다.
        "쓰지 마세요"라고 막는 대신 아예 보여주지 않는다.
        """
        return set(self.praise) | set(self.priority) | set(self.common_wrong)


def build_plan(req: CreateReportRequest) -> ReportPlan:
    plan = ReportPlan()
    for a in req.attempts:
        if a.chosen_index is None:
            plan.unanswered.append(a.index)
            continue
        if not a.is_correct:
            plan.wrong.append(a.index)
        if not a.cohort:
            continue
        rate = a.cohort.correct_rate or 0.0
        if not a.is_correct and rate >= config.REPORT_COHORT_EASY_RATE:
            plan.priority.append(a.index)
        elif not a.is_correct and rate <= config.REPORT_COHORT_HARD_RATE:
            plan.common_wrong.append(a.index)
        elif a.is_correct and rate <= config.REPORT_COHORT_HARD_RATE:
            plan.praise.append(a.index)
    return plan


def _summary_block(s: ReportSummary) -> str:
    lines = [
        f"- 출제 {s.quiz_total_count}문항 중 {s.quiz_attempted_count}문항 응시"
        f" (미응시 {s.quiz_skipped_count}문항)",
        f"- 정답 {s.quiz_correct_count}문항 / 정답률 {s.accuracy:.1f}%",
        f"- 완료율 {s.completion_rate:.1f}% / 문항당 평균 {s.avg_elapsed_ms // 1000}초",
    ]
    if s.difficulty_ratio:
        lines.append("- 난이도별: " + ", ".join(
            f"{k} {v.correct}/{v.attempted}정답(출제 {v.total})"
            for k, v in s.difficulty_ratio.items()))
    if s.concept_stats:
        lines.append("- 개념별: " + ", ".join(
            f"{k} {v.correct}/{v.attempted}정답(출제 {v.total})"
            for k, v in s.concept_stats.items()))
    return "\n".join(lines)


def _attempt_block(a: Attempt, show_cohort: bool) -> str:
    if a.chosen_index is None:
        picked = "미응시"
    else:
        chosen = a.choices[a.chosen_index] if a.chosen_index < len(a.choices) else "?"
        picked = f"학생 선택: {a.chosen_index}번 \"{chosen}\""
    answer = a.choices[a.answer_index] if a.answer_index < len(a.choices) else "?"
    mark = "정답" if a.is_correct else ("미응시" if a.chosen_index is None else "오답")
    where = f" (근거 {a.file_path} {a.line_start}~{a.line_end}줄)" if a.file_path else ""

    lines = [
        f"[{a.index}] {mark} · {a.difficulty} · 개념=\"{a.tested_concept}\"{where}",
        f"  문항: {a.question}",
        f"  정답: {a.answer_index}번 \"{answer}\" / {picked}",
        f"  소요: {a.elapsed_ms // 1000}초",
    ]
    if show_cohort and a.cohort:
        line = (f"  반 평균: {a.cohort.attempted}명 중 {a.cohort.correct}명 정답 "
                f"({a.cohort.correct_rate:.1f}%)")
        if a.cohort.choice_distribution:
            # 오답이 한 보기로 몰렸다면 그 오해가 반 전체에 퍼져 있다는 뜻이다.
            line += " · 보기별 선택 " + str(a.cohort.choice_distribution)
        lines.append(line)
    return "\n".join(lines)


def _targets_block(plan: ReportPlan) -> str:
    def nums(items: list[int]) -> str:
        return ", ".join(f"[{i}]" for i in items)

    lines = ["[작성 대상 — 이 목록 그대로 작성합니다]"]

    if plan.praise:
        lines.append(f"- strengths: {nums(plan.praise)} 각각 1개씩. "
                     "반 대부분이 틀린 문항을 맞혔다는 점이 드러나게 씁니다.")
    else:
        lines.append("- strengths: 정답률이 높았던 개념 1~2개. quiz_index 는 null.")

    targets = plan.improvement_targets
    if targets:
        order = " → ".join(f"[{i}]" for i in targets)
        note = ""
        if plan.priority:
            note = (f" 맨 앞 {nums(plan.priority)} 은 반 대부분이 맞혔는데 틀린 문항이라"
                    " 가장 먼저 확인해야 합니다.")
        lines.append(f"- improvements: {order} 이 순서로 각각 1개씩.{note}")
    else:
        lines.append("- improvements: 보완할 개념 1개. quiz_index 는 null.")

    if plan.common_wrong:
        lines.append(f"- {nums(plan.common_wrong)} 은 많은 학생이 함께 어려워한 문항입니다. "
                     "지적할 때 그 점을 덧붙여 과하게 자책하지 않도록 씁니다.")


    return "\n".join(lines)


def build_report_prompt(req: CreateReportRequest) -> str:
    plan = build_plan(req)
    shown = plan.cohort_shown
    attempts = "\n\n".join(_attempt_block(a, a.index in shown) for a in req.attempts)
    concepts = sorted({a.tested_concept for a in req.attempts if a.tested_concept})

    return f"""프로그래밍 학습자 1명의 퀴즈 응시 결과를 읽고 학습 리포트를 작성하세요.

[대상] {req.student_name} 님

[집계 — 이미 계산된 사실입니다]
{_summary_block(req.summary)}

[문항별 응시 기록]
{attempts}

{_targets_block(plan)}

[공통 규칙]
1. 숫자를 새로 계산하지 마세요. 위 집계값을 그대로 인용합니다.
2. **문장에 문항 번호를 쓰지 마세요.** `[2]`, `2번 문항`, `문제 3` 모두 금지입니다.
   위 대괄호 번호는 내부 식별자이고 **학생 화면 번호와 다릅니다.** 번호는 quiz_index 필드로만 전달합니다.
   문항을 가리켜야 하면 개념이나 문항 내용으로 지칭하세요.
3. **반 평균 수치(%)는 문장에 쓰지 마세요.** 화면에 따로 표시되므로 문장에 넣으면 같은 숫자가 두 번 나옵니다.
   수치 대신 "반 대부분이 맞힌 문항", "많은 학생이 함께 어려워한 문항"처럼 **말로** 표현하세요.
   위에 반 평균이 표시되지 않은 문항은 그런 표현조차 쓰지 마세요. 존재하지 않는 정보입니다.
4. 학생이 직접 읽는 글입니다. "이해도 낮음" 같은 낙인성 표현 대신 다음 행동으로 이어지는 표현을 쓰세요.
5. 등장하지 않은 개념을 지어내지 마세요. 등장 개념: {", ".join(concepts) or "(없음)"}
6. 미응시는 오답과 구분합니다. 못 푼 것이 아니라 안 푼 것입니다.
7. 모두 한국어 존댓말로 씁니다.

[필드별 지침]
- comment: 3~5문장. **첫 문장에 응시 현황과 정답률을 그대로 넣습니다**
    (예: "8문항 중 7문항 응시, 정답률 57.1%"). 잘한 점을 먼저, 보완점을 뒤에 둡니다.
- strengths: **그 개념의 핵심이 무엇이고 학생이 그중 무엇을 잡았는지** 씁니다.
    "정답을 맞히셨습니다", "근거가 정답과 일치합니다" 같은 동어반복은 쓰지 마세요.
    맞혔다는 사실은 화면에 이미 있습니다. 내용을 쓰세요.

- improvements: 오답이면 아래 두 가지를 **순서대로** 한 항목에 담습니다.
    ① 학생이 고른 보기를 그대로 인용하고, **그 선택이 코드상 왜 성립하지 않는지**
       변수·조건·실행 순서로 설명합니다.
       예: "'hi를 줄이려고'를 고르셨는데, arr[mid] < target이면 mid는 target 이상이
            될 수 없어 답이 될 수 없습니다. 그래서 lo = mid + 1로 mid를 버려야 합니다."
    ② 다음에 할 행동 한 가지.
    미응시 문항이면 ①을 생략하고 그 개념이 무엇인지 짚은 뒤 ②를 씁니다.

    **학생의 심리를 추측하지 마세요.** "~하신 것으로 보입니다", "~가능성이 큽니다",
    "~흐름으로 이어졌을" 같은 표현을 쓰지 말고 코드가 어떻게 동작하는지 **단정해서** 쓰세요.
    "~할 수 있습니다"로 얼버무리지 말고 결론을 말합니다.

- focus_concepts: 등장 개념 중 정답률이 낮은 순서로 **최대 3개**. 전부 나열하지 마세요.

지정된 출력 형식(JSON 스키마)에 맞춰서만 답하세요.
"""
