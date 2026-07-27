Pinned above the editor/Room content while the socket is not healthy; the connected variant is shown only briefly after recovery, otherwise the editor status strip carries it. Offline never blocks editing — it states that changes are queued locally.
```jsx
<ConnectionBar status="reconnecting" detail="CRDT 세션 복구 시도 2/5" />
```