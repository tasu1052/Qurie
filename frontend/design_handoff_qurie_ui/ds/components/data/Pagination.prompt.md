Full `<Pagination>` on list pages; `<LoadMore>` under Top-N dashboard cards ("매니저 8명 더보기" — name the remaining count, and it links to the full list page when there is one). Never leave a truncated list without one of the two.
```jsx
<Pagination page={2} pageCount={11} pageSize={12} rangeLabel="13–24 / 128명" onPage={setPage} />
<LoadMore label="매니저 8명 더보기" loading={isFetchingNextPage} onClick={fetchNextPage} />
```