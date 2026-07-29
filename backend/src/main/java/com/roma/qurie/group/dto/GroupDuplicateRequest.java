package com.roma.qurie.group.dto;

import jakarta.validation.constraints.Size;

/**
 * 그룹 복제 요청. 이름을 주지 않으면 원본 이름 뒤에 " (복사)" 를 붙인다.
 * 구성원까지 복제할지는 화면에서 고르게 하되, 한 사람이 여러 그룹에 들어가는 걸 허용하는 문제가 있어
 * 기본값은 껐다(레이아웃만 복제).
 */
public record GroupDuplicateRequest(
        @Size(max = 100) String name,
        Boolean includeMembers) {

    public boolean shouldIncludeMembers() {
        return Boolean.TRUE.equals(includeMembers);
    }
}
