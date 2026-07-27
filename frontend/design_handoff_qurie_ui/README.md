# Handoff: Qurie UI Mockups v2 — Full Product Surface

## Overview
Complete hi-fi UI mockups for **Qurie**, a collaborative code-review + AI-quiz learning platform for enterprise/institutional education. 20 screens across 5 areas: Marketing & Auth, Master console, Class Manager console, Student screens, and Session (code editor) & Report — plus a sixth area of **state variants** (loading, error, empty, connection) that every data screen can enter.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in React** (the target stack) using your codebase's established patterns. The design system source is a shadcn/ui-based monorepo ("Maia" preset base + Qurie tokens) — map components 1:1 where possible.

Screens 1a–1t are split across `Qurie Mockups 1–5 *.dc.html` (one file per area); `Qurie UI Mockups v2.dc.html` is the single-file master of the same 20 screens, and `Qurie Mockups 6 - States.dc.html` holds the state variants. All use the same structure.

`Qurie UI Mockups v2.dc.html` is the master file. It uses a lightweight template runtime (`support.js`); ignore the runtime — read the file for markup, inline styles (all styling is inline), and the `<script type="text/x-dc">` block at the bottom for interaction logic (plain JS class). Screens are wrapped in `.dv-card` containers inside `<section id="t1a">…</section>` turn groups; each screen has an id badge (1a–1t) and `data-screen-label`.

## Ownership & scope
UI work in the target repo covers **components, pages, and UI elements only**. Async handling, API clients, and TanStack Query are owned by another developer — see `AGENTS.md`. Components take `data`, `status`, and `onRetry` as props and never fetch; `src/mocks/` holds throwaway fixtures for simulating flows until the data layer arrives. Setup steps, route map, and build order are in `HANDOFF_TO_CURSOR.md`.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, copy, and states are final. Recreate pixel-perfectly using the design-system components listed below.

## Screens / Views (id → screen)
**1 · Marketing & Auth**
- **1a Landing** — B2B marketing page: topbar (wordmark, nav, 로그인/도입 문의), hero with headline + dual CTA + animated product mock, 3-feature grid, KPI band (dark ink strip), footer.
- **1b Login** — centered 420px card on `#FAFAFA`: email/password inputs (pill), primary ink button, links to signup/reset.
- **1c Signup** — invite-based signup card: name/email/password + password rules checklist, terms checkbox.
- **1d Password Reset** — single-field card with send-link CTA and back-to-login link.

**2 · Master console** (sidebar 232px + topbar 56px shell)
- **1e Master Dashboard** — 4 StatCards, track cards grid (진행률 bar, 클래스/학생 수), recent announcements list.
- **1s Track Detail** — track header + stat row, class DataTable (담당 매니저, 학생 수, 진행률, 상태 Badge), 주차별 커리큘럼 list.
- **1f Class Management** — class DataTable with search Input, status filters, 클래스 생성 Modal (name, track Select, manager Select, capacity).
- **1g Member Management** — member DataTable (역할 Badge: MASTER/MANAGER/STUDENT, 상태: ACCEPTED/PENDING/EXPIRED), 초대 Modal (email + role Select), pending invites section.
- **1h Announcements** — compose card (target Select: 전체/트랙/클래스, title, body) + sent list with target Badges.
- **1i Track Analytics** — filter row, LineChart (주차별 세션 참여), BarChart (클래스별 평균 정답률), DonutCharts, insight cards.
- **1t Class Analytics Detail** — GA-style: metric filter chips, large LineChart, dimension DataTable, 난이도 비율 DonutChart (centered in card).

**3 · Class Manager console**
- **1j Manager Dashboard** — today's sessions, class StatCards, recent session reports list.
- **1k Student Management** — participant DataTable. **Class roles are ADMIN / STUDENT only** (TEMP_ADMIN was removed from the ERD — do not implement it). Role Select inline in rows; 박민수 is STUDENT.
- **1l Student Overview** — student profile header, 난이도별 정답 분포 DonutChart (centered), weekly participation LineChart, session history table.

**4 · Student screens**
- **1n Student Dashboard** — 나의 세션 carousel cards, upcoming quiz list, my stats row.
- **1m Class Lobby** — class home tabs (홈/기록/자료/그룹), notice strip, session cards, group creation Modal.
- **1r My Page** — profile card + 계정 정보 rows. 시스템 역할 badge = **STUDENT** (박민수 is a student; MANAGER does not apply), 보안 section (password change).

**5 · Session & Report**
- **1o Code Editor — 협업 모드** — dark IDE (`#111` chrome): file tree, Monaco-style editor pane with colored collaborator cursors + avatars, Git menu, voice chat bar, right review-comment thread.
- **1p Code Editor — AI 퀴즈 모드** — same shell; right panel switches through 생성 (난이도/유형 pickers) → 문제 (Timer ring, options) → 결과 states.
- **1q Session Report** — report header, score StatCards, per-question accuracy BarChart, participant DataTable, AI summary card.

**6 · States** (`Qurie Mockups 6 - States.dc.html`)
- **6a Page-level states** — Manager Dashboard shell in 로딩 / 오류 / 빈 상태. Switched by the `pageState` prop; `showErrorDetail` toggles the mono request_id line.
- **6b Loading elements** — Spinner sm/md/lg + labelled, loading buttons (primary/secondary/accent), determinate + indeterminate ProgressBar, table skeleton with a "추가 행 불러오는 중" footer row.
- **6c Error elements** — AlertBanner error/warning/info, field error (error-bordered input + message) vs. helper text, widget-failure card with mono code + 다시 시도, inline row-save failure with 되돌리기.
- **6d Full-page errors** — 404, 403 (role-aware copy), 500 (request_id), SESSION_EXPIRED. Each is centered, has ≤ 2 actions, and names the code in mono above the title.
- **6e Empty states** — no data (CTA), no search results (검색어 지우기), no filter results (active filter chips), first-run (wordmark + dual CTA).
- **6g Row progressive loading** — the same dashboard mid-load: shell rendered, row 1 (KPI) ready, row 2 (analytics) skeleton, row 3 (sessions) failed with a row-scoped retry, plus a load-order strip. This is the intended production loading model.
- **6f Connection & toasts** — ConnectionBar offline/reconnecting/connected, ink Toasts (success, in-progress with mono counter, error with retry), editor status strip (동기화 대기 중, 읽기 전용).

Modals (1f, 1g, 1m) and the quiz panel states are toggled by boolean props in the DC script block — read it for open/close behavior.

## Interactions & Behavior
- Hover: surfaces tint `--surface-hover`; buttons darken one shade; links → `--accent-strong` + underline. Press: one shade darker, no scale.
- Motion: 120–180ms ease-out on hover/focus/expand; modal fade + 4px rise. Quiz Timer: calm linear sweep, no pulsing.
- Focus: 2px indigo-300 ring, 2px offset.
- Sidebar collapses 232px → 64px; topbar has ⌘K search, bell, account chip.
- Charts show frosted-ink tooltips on hover (see Glass treatment below).

## Glass treatment (intentional, subtle glassmorphism)
- Modal scrim: `rgba(17,17,17,0.32)` + `backdrop-filter: blur(16px) saturate(1.4)`.
- Modal card: `linear-gradient(155deg, rgba(255,255,255,0.86), rgba(255,255,255,0.74))`, `backdrop-filter: blur(30px) saturate(1.5)`, border `1px solid rgba(255,255,255,0.7)`, shadow `var(--shadow-modal), inset 0 1px 0 rgba(255,255,255,0.8)`, radius 20px.
- Dropdown/popover: same recipe at `0.82/0.7` opacities, `blur(22px) saturate(1.45)`, inset highlight `rgba(255,255,255,0.75)`, radius 12px.
- Chart tooltip: `rgba(17,17,17,0.68)` + `blur(12px) saturate(1.3)`, border `1px solid rgba(255,255,255,0.1)`, radius 10px.
- Everything else (cards, sidebars, tables) is flat opaque per the design system.

## State Management
- Auth flow: email/password login, invite-token signup, reset-link request.
- Role model: system roles MASTER / MANAGER / STUDENT; class roles **ADMIN / STUDENT** (no TEMP_ADMIN). Invite states PENDING / ACCEPTED / EXPIRED.
- Editor session: CRDT-backed shared document (Yjs + WebSocket per architecture), collaborator presence (cursors, avatars, voice state).
- Quiz panel: state machine 생성 → 문제(n of m, timer) → 결과.
- Modals: open/close booleans (invite, class create, group create).

## Design Tokens
Copy exact values from `ds/tokens/*.css` (included in this bundle). Key values:
- Ink `#111111`, accent indigo `#6366F1` (single accent), app bg `#FAFAFA`, cards `#FFFFFF`, border `rgb(232,232,234)`, muted text `#64748B` / `#9c9ca1`.
- Status colors: desaturated green/amber/red/slate (see `tokens/colors.css` `--status-*`).
- Type: Inter (Latin) + Noto Sans KR (self-hosted, `ds/assets/fonts/`), JetBrains Mono for code/ids. Scale: KPI 36–44 bold, H1 28 / H2 22 / H3 17 / H4 14, body 14, caption 12.
- Spacing: 8px grid, 24px card padding (stat cards 20px), 24px gutters.
- Radii: pill controls (999px), cards 16px, modals 20px, popovers 12px, badges pill.
- Shadows: hairline `--shadow-card`; modal `--shadow-modal`. No gradients outside the glass recipe above.

## Component Mapping
Recreate with the design-system components (source in `ds/components/`, one folder per group, `.jsx` + `.d.ts` + `.prompt.md`): Button, Badge, Input, Select, DataTable, StatCard, **StatCardRow**, BarChart, LineChart, DonutChart, **ChartLegend**, Modal, EmptyState, Timer, Sidebar, Topbar, Chevron, **Footer**, and the state components **Skeleton / SkeletonText, Spinner, ProgressBar, AlertBanner, ErrorState, Toast / ToastStack, ConnectionBar, RowSection** (all in `ds/components/feedback/`). Icons: Lucide (1.75px stroke). No emoji, no imagery.

## Frontend conventions & ESLint (binding)
`eslint.config.mjs` + `tools/eslint-plugin-qurie/` encode the design conventions as lint rules — any agent writing UI in this repo (Claude Code included) is subject to them. Run with `npx eslint .` (ESLint 9+, flat config; add typescript-eslint parser for `.tsx`).

**StatCard**
- `delta` is a signed numeric change only; it renders immediately right of the value (baseline-aligned) so card layout/ratio never shift: green `↑` for increase, red `↓` for decrease. No other delta treatment exists. Status words (LIVE…) go in `caption`. *(qurie/statcard-delta)*
- StatCards always sit in a `<StatCardRow>`: uniform card size via `grid-auto-columns`; on narrow viewports cards keep their size and the row scrolls, with a round indigo chevron arrow appearing at the overflowing edge to page to hidden cards — never wrap or shrink. *(qurie/statcard-in-row)*

**Charts**
- Every chart carries one common element outside the plot: the `<ChartLegend>` row — color swatch box + series name (▪ 서울 2반), never color words ("ink: 서울 2반"). DonutChart's side legend is built in. *(qurie/chart-legend, qurie/no-color-word-label)*
- LineChart: max 2–3 series, one indigo accent, rest ink/grey; dots only when points are annotated. BarChart: single ink series, at most one indigo highlight bar; value labels only ≤ 8 bars. DonutChart: one indigo accent segment, rest grayscale, center value + label required. All: flat token colors, `tabular-nums`, uppercase 11px card label on top.

**Foundations**
- Token colors only (`var(--…)`), no raw hex/rgb outside `ds/tokens` *(qurie/no-raw-color)*; no gradients *(qurie/no-gradient)*; no emoji *(qurie/no-emoji)*; Maia radius scale *(qurie/radius-token)*; no external UI/chart/CSS-in-JS libraries *(no-restricted-imports)*.

**Typography**
- `fontSize` sticks to the Qurie scale — caption 10–13.5 (12 default), body 14, H3 17, H2 22, H1 28, KPI 36–44, display 79; no in-between sizes (16, 18, 20, 24…). *(qurie/font-size-scale)*
- `fontWeight` 400/500/600/700 only; 800 is reserved for the `Q>rie` chevron/wordmark; never thin (<400) or 900. *(qurie/font-weight-scale)*
- `fontFamily` is always a token: `var(--font-sans)` (Inter + Noto Sans KR) or `var(--font-mono)` (JetBrains Mono) — raw font stacks live only in `ds/tokens`. *(qurie/font-family-token)*

**Tech-stack icons**
- Raster tech logos live in `ds/assets/tech/` named `{tech}_{size}.png` — tech ∈ java, python, javascript, typescript, react, vuejs, spring, django, bootstrap, html5, css3, database; `{tech}_light_{size}.png` variants for dark/ink surfaces. *(qurie/tech-icon)*
- Track, class, and session elements show their track's tech icon: 38px tile (10px radius, `--surface-sunken`; `--accent-softer` when active) with a 22px `object-fit:contain` img + alt text; 52px tile / 30px img on detail headers. On ink surfaces use a `rgba(255,255,255,0.92)` plate or the `_light` variant.
- Lucide remains the icon set for UI actions — tech logos are the only raster icons.

**Row-level loading (binding)**
- Pages load in two tiers: the **shell** — Sidebar, Topbar/Header, Footer — renders immediately with no data, and the content region below it resolves **one grid row at a time**. Never a single page-wide spinner over the whole route. *(qurie/shell-outside-state)*
- Each grid row is its own boundary: `<RowSection status skeleton onRetry>` wraps the row, owns its own fetch, and renders skeleton → content or a **row-scoped** error ("이 행만 다시 시도"). One row failing or hanging never blocks the rows above or below it.
- Rows resolve in visual order (KPI → charts → lists) so the page fills top-down; a later row must not delay an earlier one.
- Each row's skeleton occupies the loaded row's exact height (same card padding, same grid template) — no reflow when data lands.
- 6a's whole-content states are the fallback for a route that genuinely has one data source; 6g is the default.

**Async states (binding)**
- Every data view implements four states — loading, error, empty, ready — from the DS feedback components. No ad-hoc "로딩 중" text and no hand-rolled skeleton/spinner markup. *(qurie/state-components)*
- **First paint = Skeleton**, mirroring the real layout (same card padding, same block sizes) so nothing shifts when data lands; stagger sibling `delay` by 0.08s. **Action = Spinner**: a loading button keeps its label and width, swaps its icon slot for `<Spinner size="sm" tone="inverse" />`, and drops to 0.72 opacity.
- Motion is a calm opacity pulse (`qurie-skeleton`, 1.4s) and a linear ring sweep (`qurie-spin`, 0.9s) — keyframes live in `ds/styles.css`, disabled under `prefers-reduced-motion`. No shimmer gradients (gradients are banned).
- Failure is scoped to the region that failed: one `<ErrorState>` replaces that card, the rest of the page keeps rendering. Unavailable KPIs read as an em dash with a "데이터 없음" caption — never 0, which is a real value. Technical detail (status, service, `request_id`) goes in the mono `code` slot, never in the description.
- Every error and empty state offers exactly one way forward (다시 시도 / a primary CTA), plus at most one secondary. *(qurie/state-action)*
- Banner vs. toast vs. field error: page-level problems use `<AlertBanner>` at the top of `<main>` (max one at a time); results of a user action use `<Toast>` bottom-right (4s auto-dismiss, error toasts persist, max 3 stacked); input problems stay on the field. Realtime socket health uses `<ConnectionBar>` on editor/Room surfaces — offline never blocks editing, it states that changes are queued locally.

**Footer**
- Every page with a `<main>` region closes with `<Footer />`: `Q>rie` wordmark left, `© 2026 Qurie · 현재 데모 버전` right. Editor/Room surfaces (no `<main>`) are exempt; the landing page keeps its own marketing footer. *(qurie/page-footer)*

## Assets
- `ds/assets/logo.png`, `favicon.png` (+ cropped variants) — brand marks.
- `ds/assets/fonts/` — Noto Sans KR ×9 weights.
- `screens/*.png` — 2× reference captures of every screen (named by id), including `6a`–`6f` for the state variants. **Note:** the 1a–1t captures predate the StatCardRow / ChartLegend / Footer conventions — the design files are the source of truth.

## Files
- `AGENTS.md` — ownership boundary + binding rules for any agent writing code in the target repo
- `HANDOFF_TO_CURSOR.md` — local setup, route map, mock-adapter seam, build order
- `Qurie Mockups 1–5 *.dc.html` — the 20 screens split by product area (same content as the master)
- `Qurie UI Mockups v2.dc.html` — master design file (all 20 screens; markup + inline styles + logic script at bottom)
- `Qurie Mockups 6 - States.dc.html` — state variants (6a–6f); `pageState` / `showErrorDetail` / `showToasts` props drive 6a and 6f
- `support.js` — template runtime (reference only, do not port)
- `hero-animation.jsx`, `animations-v2.jsx` — landing hero product-mock animation (1a)
- `ds/` — design-system tokens, styles.css, components source, assets
- `eslint.config.mjs`, `tools/eslint-plugin-qurie/` — binding frontend conventions as lint rules
- `screens/` — PNG captures of each screen (1a–1t)
