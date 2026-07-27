# Local setup & Cursor handoff

## What this bundle is
Design references (HTML prototypes) + the Qurie design system + binding lint rules. **Recreate** them in React; do not ship the HTML.

## Suggested local stack
Vite + React + TypeScript + React Router. No UI, chart, or CSS-in-JS libraries — the design system is the component source of truth (`ds/components/`), styling is inline styles + `ds/tokens/*.css` custom properties.

```
npm create vite@latest qurie-web -- --template react-ts
cd qurie-web && npm i react-router-dom
# copy this bundle in:
#   ds/            -> src/ds/            (tokens, styles.css, components source to port)
#   eslint.config.mjs, tools/            -> repo root
#   AGENTS.md                            -> repo root
# import src/ds/styles.css once in main.tsx
npx eslint .
```

## Ownership
Read `AGENTS.md` first — async/API/TanStack Query belong to a teammate and are out of scope for this repo's UI work.

## Simulating the user flow before his repo exists
```
src/mocks/
  fixtures.ts    // static data per screen (students, tracks, sessions, quiz, report)
  adapters.ts    // useKpiRow(), useAnalyticsRow(), useSessionRow() -> { status, data, refetch }
  scenario.ts    // 'ready' | 'loading' | 'error' | 'empty' + a delay, driven by a dev-only switch
```
Adapters return the same `{ status, data, refetch }` shape the teammate's TanStack hooks will return, backed by `setTimeout` + fixtures. A dev-only scenario switch (query param `?state=loading|error|empty`) lets the whole flow be walked through in every state — this is exactly what mockup **6 · States** documents. When his repo lands, re-point the imports in the pages; delete `src/mocks/`.

## Screen → route map
| Route | Screen | Mockup file |
| --- | --- | --- |
| `/` | 1a Landing | Mockups 1 |
| `/login`, `/signup`, `/reset` | 1b–1d | Mockups 1 |
| `/master` | 1e Master dashboard | Mockups 2 |
| `/master/tracks/:id` | 1s Track detail | Mockups 2 |
| `/master/classes` | 1f Class management | Mockups 2 |
| `/master/members` | 1g Member management | Mockups 2 |
| `/master/announcements` | 1h Announcements | Mockups 2 |
| `/master/analytics`, `/master/analytics/:classId` | 1i, 1t | Mockups 2 |
| `/manager` | 1j Manager dashboard | Mockups 3 |
| `/manager/students`, `/manager/students/:id` | 1k, 1l | Mockups 3 |
| `/app` | 1n Student dashboard | Mockups 4 |
| `/app/classes/:id` | 1m Class lobby | Mockups 4 |
| `/app/me` | 1r My page | Mockups 4 |
| `/session/:id` | 1o/1p Code editor (collab / quiz) | Mockups 5 |
| `/session/:id/report` | 1q Session report | Mockups 5 |
| every route | 6a–6g state variants | Mockups 6 |

## Build order
1. Port `ds/components/` to `src/ds/` (Button, Badge, Input, Select, DataTable, StatCard/StatCardRow, charts, ChartLegend, Modal, Sidebar, Topbar, Chevron, Footer, feedback group incl. Skeleton/Spinner/ProgressBar/AlertBanner/ErrorState/Toast/ConnectionBar/RowSection/EmptyState/Timer).
2. App shell: Sidebar + Topbar + Footer, rendered immediately, never inside a load boundary.
3. Pages by area (2 → 3 → 4 → 5 → 1), each row wrapped in `<RowSection>`.
4. Wire `src/mocks/adapters.ts` and walk the flow in ready / loading / error / empty.
