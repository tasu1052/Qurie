Ring spinner for actions and short waits (buttons, "추가 행 불러오는 중", toasts). Full-surface first loads use `<Skeleton>`. A loading button keeps its label, swaps the icon slot for `<Spinner size="sm" tone="inverse" />`, and drops to 0.72 opacity — never changes width.
```jsx
<Button variant="primary" disabled icon={<Spinner size="sm" tone="inverse" />}>저장 중</Button>
<Spinner label="퀴즈 채점 중" />
```