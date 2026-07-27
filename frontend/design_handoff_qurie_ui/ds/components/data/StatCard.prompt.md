# StatCard

KPI card: oversized numeral first, small muted label + caption below.

Delta rules (lint-enforced):
- `delta` accepts a signed numeric change only ("+2.1%", "-3", "+4"). Status words
  (LIVE, PENDING…) belong in `caption`.
- The delta renders immediately RIGHT of the value (baseline-aligned) so the card's
  layout and ratio never shift: green `↑` for an increase, red `↓` for a decrease.
  There is no other delta treatment — no badges, no neutral gray, no icons.
- `deltaDirection` is derived from the sign; only set it explicitly when the sign
  and direction genuinely differ (avoid — prefer restating the metric).
- StatCards always live inside a `StatCardRow` (uniform sizing + overflow arrows).

```jsx
<StatCard value="86%" label="퀴즈 참여도" delta="+2.4%" caption="최근 8주" accent />
<StatCard value="74%" label="세션 액티비티" delta="-3%" caption="주간 참여율 평균" />
<StatCard value="3" label="활성 세션" caption="LIVE · 현재 접속 41명" />
```
