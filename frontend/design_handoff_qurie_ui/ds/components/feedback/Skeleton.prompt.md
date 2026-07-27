Skeletons mirror the real layout (same card padding, same block sizes) so nothing shifts on load. Use for first paint of KPI rows, tables, and charts; use `<Spinner>` for actions instead. Stagger `delay` by 0.08s across siblings. Requires the `qurie-skeleton` keyframes from `styles.css`.
```jsx
<StatCardRow>
  <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
    <Skeleton width={76} height={11} />
    <Skeleton width={104} height={30} radius={8} delay={0.1} />
  </div>
</StatCardRow>
```