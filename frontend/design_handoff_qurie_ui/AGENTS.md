# AGENTS.md — Qurie frontend (read before writing any code)

This repo is split between two people. **Stay inside your lane.**

## Ownership boundary (binding)

| Owner | Area | Files |
| --- | --- | --- |
| **Me (this repo's UI owner)** | Components, pages, routing shells, UI elements, all visual state | `src/components/**`, `src/pages/**`, `src/routes/**`, `src/styles/**`, `src/mocks/**` |
| **Teammate (do not touch)** | Async handling, API clients, TanStack Query, server state, error/retry policy, caching | `src/api/**`, `src/queries/**`, `src/hooks/use*Query.ts`, `queryClient` setup, MSW/server handlers |

**Rules for any agent working here:**
1. Do **not** install, import, configure, or write `@tanstack/react-query`, `axios`, `fetch` wrappers, service workers, or any API client. No `QueryClientProvider`, no `useQuery`/`useMutation`.
2. Components never fetch. Every component receives data and state through **props**: `data`, `status: 'loading' | 'error' | 'empty' | 'ready'`, `onRetry`. That is the whole contract with the teammate's layer.
3. To simulate flows before his repo is cloned, use the fixtures in `src/mocks/` and local `useState`/`useReducer` only. Everything simulation-related lives under `src/mocks/` so it can be deleted in one move when the real data layer lands.
4. Page components compose `<RowSection status={…}>` per grid row and pass status straight through — no data-layer logic inside them.
5. Design conventions in `eslint.config.mjs` + `tools/eslint-plugin-qurie/` are binding. Run `npx eslint .` before finishing.
6. Recreate the mockups in this bundle exactly (colors, type, spacing, copy). Do not invent screens, copy, or components; ask instead.

## Integration seam
`src/mocks/adapters.ts` exports one function per screen region returning `{ status, data, refetch }`. The teammate's hooks will later export the **same shape** — swapping the import path is the entire integration. Do not change the shape unilaterally.
