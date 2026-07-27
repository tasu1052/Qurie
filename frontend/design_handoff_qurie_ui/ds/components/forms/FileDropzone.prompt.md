The session's no-project state (1o). State the constraint up front in mono, keep unavailable paths visible but disabled (Git 연동), and show upload progress in an `<UploadRow>` under the zone — never a blocking modal. Failures name the status code.
```jsx
<FileDropzone title="리뷰할 프로젝트를 올려 주세요" description="zip 파일을 끌어다 놓거나 파일을 선택하세요." hint=".zip · 최대 50MB" />
<UploadRow name="seoul-1-java-review.zip" percent={62} />
<UploadRow error="파일이 50MB를 초과합니다 · 413 PAYLOAD_TOO_LARGE" onRetry={pick} />
```