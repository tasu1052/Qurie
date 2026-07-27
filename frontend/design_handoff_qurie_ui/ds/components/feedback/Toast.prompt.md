Transient results of user actions (4s auto-dismiss; error toasts stay until dismissed or retried). Never used for validation — that is a field error — and never for page-level failures, which use `<AlertBanner>` or `<ErrorState>`. Max 3 stacked.
```jsx
<ToastStack>
  <Toast icon={<Check size={15} />} message="초대 12건을 보냈습니다" actionLabel="보기" />
  <Toast tone="error" icon={<AlertCircle size={15} />} message="저장하지 못했습니다" actionLabel="다시 시도" />
</ToastStack>
```