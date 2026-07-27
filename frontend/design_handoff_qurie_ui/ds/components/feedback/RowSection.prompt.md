The page shell (Sidebar, Topbar, Footer) renders immediately; the content region resolves **one grid row at a time**, each row wrapped in the data layer's `<QueryAsyncBoundary>`. The UI layer supplies the two fallbacks and the row shell — it never writes Suspense, an error boundary, or a fetch.

```tsx
<main>
  <QueryAsyncBoundary
    suspenseFallback={<RowSkeleton height={132} columns={4} />}
    errorFallback={<RowErrorFallback onRetry={reset} />}
  >
    <RowSection label="row 1 · kpi"><KpiRow /></RowSection>
  </QueryAsyncBoundary>

  <QueryAsyncBoundary
    suspenseFallback={<ChartRowSkeleton />}
    errorFallback={<RowErrorFallback title="주간 활동을 불러오지 못했습니다" onRetry={reset} />}
  >
    <RowSection label="row 2 · analytics"><AnalyticsRow /></RowSection>
  </QueryAsyncBoundary>

  <Footer />
</main>
```

Rules: one boundary per row, never one around the whole page; the skeleton reserves the loaded row's exact height; the error fallback is row-scoped ("이 행만 다시 시도") and leaves neighbouring rows untouched; `onRetry` is wired to the boundary's reset, not to a fetch written here. Empty states are NOT a boundary concern — a successful query with no rows renders `<EmptyState>` inside the row.
