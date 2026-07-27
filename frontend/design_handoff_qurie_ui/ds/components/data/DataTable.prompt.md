Data table with sortable headers and thin dividers; compose Badge/Select into cells via `render`.
```jsx
<DataTable columns={[{key:'name',label:'이름',sortable:true},{key:'status',label:'상태',render:r=><Badge status="warning">{r.status}</Badge>}]} rows={rows} />
```