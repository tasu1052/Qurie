Every DELETE on a track, class, session, group, member, or notice goes through this modal — no bare confirm(), no one-click delete. The confirm button unlocks only on an exact name match; a 409 from the server flips `conflict` on and the cascade checkbox becomes the second gate. Never pre-fill `typed`.
```jsx
<ConfirmDeleteModal title="서울 1반을 삭제할까요?" description="이 작업은 되돌릴 수 없습니다."
  confirmText="서울 1반" typed={value} childCounts={['세션 24','그룹 6','리포트 312']}
  conflict={error?.code === 'CONFLICT'} cascade={cascade} onCascadeChange={setCascade} onConfirm={remove} />
```