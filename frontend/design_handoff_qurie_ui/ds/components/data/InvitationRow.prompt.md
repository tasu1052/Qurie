Pending invitations are actionable in place: resend (60s cooldown, shown as a live countdown on the button) and cancel. EXPIRED promotes resend to the primary style; ACCEPTED drops both actions and links to the member instead. A successful resend confirms with a Toast that states the new expiry and offers undo.
```jsx
<InvitationRow email="hana@ssafy.com" meta="MANAGER · 2026-07-25 발송 · 만료 D-1" onResend={resend} onCancel={cancel} />
<InvitationRow email="jiwoo@ssafy.com" meta="STUDENT · 방금 재발송됨" cooldownSec={52} />
```