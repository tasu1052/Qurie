package com.roma.qurie.project.dto;

/** 파일 트리 렌더용 요약. 트리 구조는 프론트가 경로 문자열에서 파생한다. */
public record ProjectFileSummaryResponse(String path, long size) {
}
