Anything the API answers with 202 renders here, and the panel's badge shows the server's status string verbatim (PENDING → GENERATING → DONE | FAILED). Partial progress is stated as "n / m", never as a fake percentage. A failure offers retry and, where partial output is usable, a way to continue with it. Closing the panel never cancels the job — say so.
```jsx
<AsyncJobPanel label="AI 퀴즈" status="GENERATING" title="문항 생성" done={6} total={10} meta="polling GET /quiz-sets/8f21 · 2s" />
<AsyncJobPanel label="AI 퀴즈" status="FAILED" title="퀴즈를 만들지 못했습니다" errorMessage="error_message: llm_timeout · 4/10"
  primaryLabel="다시 생성" secondaryLabel="생성된 4문항으로 진행" />
```