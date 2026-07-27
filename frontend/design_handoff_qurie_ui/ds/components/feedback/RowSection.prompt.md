Wrap every grid row of a page in its own `<RowSection>`: the shell (Sidebar, Topbar, Footer) renders with no data, then rows resolve independently — KPI row first, then charts, then lists. A failed row shows a scoped error with "이 행만 다시 시도" and leaves neighbouring rows untouched. The row skeleton mirrors the loaded row's height exactly.
```jsx
<main>
  <RowSection status={kpi.status} skeleton={<KpiRowSkeleton />} onRetry={kpi.refetch}>
    <StatCardRow>…</StatCardRow>
  </RowSection>
  <RowSection status={charts.status} skeleton={<ChartRowSkeleton />} onRetry={charts.refetch}>…</RowSection>
  <Footer />
</main>
```