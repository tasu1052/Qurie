# StatCardRow

Horizontal row for KPI StatCards.

Rules (lint-enforced):
- StatCards never sit loose in a page grid — always inside `<StatCardRow>`.
- All cards in a row share one uniform size (`grid-auto-columns: minmax(minWidth, 1fr)`).
- On narrow viewports cards keep their size; the row scrolls horizontally and a round
  chevron arrow (indigo `›` / `‹`, 32px pill button) appears at the overflowing edge.
  Clicking it pages to the hidden cards. No wrapping, no card shrinking.

```jsx
<StatCardRow minWidth={250}>
  <StatCard value="87%" label="퀴즈 평균 정답률" delta="+2.1%" caption="지난 주 대비" accent />
  <StatCard value="12" label="활성 매니저" delta="+2" caption="이번 주 기준" />
</StatCardRow>
```
