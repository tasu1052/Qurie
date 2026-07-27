One error card replaces the failed region only — the rest of the page keeps rendering. KPI values become an em dash with a "데이터 없음" caption rather than 0. Every error state carries a retry or an equivalent action; technical detail goes in `code`, never in the description.
```jsx
<ErrorState icon={<CloudOff size={20} />} title="차트를 표시할 수 없습니다"
  description="GET /api/analytics/weekly 요청이 504로 실패했습니다."
  code="request_id: 8f21c0ae" actionLabel="다시 시도" secondaryLabel="지원팀 문의" />
```