Any column the API can sort on gets one. Three visible states — unsorted (grey ↕), asc (indigo ↑), desc (indigo ↓) — and a third click clears it. Sorting is server-side: the state maps straight to `?sort=progress,desc`. Columns the API cannot sort stay plain text.
```jsx
<SortableHeader label="진도" sortKey="progress" sort={sort} index={1} onSort={setSort} />
```