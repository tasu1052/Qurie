# AGENTS.md — Qurie frontend (read before writing any code)

This repo is split between two people. **Stay inside your lane.**

## Ownership boundary (binding)

| Owner | Area | Files |
| --- | --- | --- |
| **Me (this repo's UI owner)** | Components, pages, routing shells, UI elements, all visual state | `src/components/**`, `src/pages/**`, `src/routes/**`, `src/styles/**`, `src/mocks/**` |
| **Teammate (do not touch)** | Async handling, API clients, TanStack Query, server state, error/retry policy, caching | `src/api/**`, `src/queries/**`, `src/hooks/use*Query.ts`, `queryClient` setup, MSW/server handlers |

**Rules for any agent working here:**
1. Do **not** install, import, configure, or write `@tanstack/react-query`, `axios`, `fetch` wrappers, service workers, or any API client. No `QueryClientProvider`, no `useQuery`/`useMutation`.
2. Components never fetch. Async state arrives through the teammate's `<QueryAsyncBoundary suspenseFallback errorFallback>`: Suspense and the error boundary are his, the **fallbacks are ours**. A component either renders data it was given or reads it through a hook he exports — it never declares `<Suspense>`, an `ErrorBoundary`, `useQuery`, or a fetch.
3. To simulate flows before his repo is cloned, use the fixtures in `src/mocks/` and local `useState`/`useReducer` only. Everything simulation-related lives under `src/mocks/` so it can be deleted in one move when the real data layer lands.
4. Page components wrap each grid row in one `<QueryAsyncBoundary>` with `suspenseFallback={<RowSkeleton …/>}` and `errorFallback={<RowErrorFallback onRetry={reset} />}`, with `<RowSection>` around the loaded content. One boundary per row, never one around the page, and the shell (Sidebar/Topbar/Footer) stays outside every boundary.
5. Design conventions in `eslint.config.mjs` + `tools/eslint-plugin-qurie/` are binding. Run `npx eslint .` before finishing.
6. Recreate the mockups in this bundle exactly (colors, type, spacing, copy). Do not invent screens, copy, or components; ask instead.

## Integration seam
Two seams, both owned by the teammate:
1. `<QueryAsyncBoundary>` — we pass `suspenseFallback` and `errorFallback`; he decides when they show.
2. His query hooks — we call them and render the result. Where a hook does not exist yet, `src/mocks/adapters.ts` stands in with the **same call signature and return shape**, so integration is an import swap. Do not change either shape unilaterally; list what you need instead.
