package com.roma.qurie.common.dto;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * 목록 응답 공통 형식. API 설계안 §7의 { data, meta { page, size, total } } 규약을 따른다.
 * 프론트가 total=0과 필터 결과 0건을 구분해야 하므로 빈 목록에서도 meta를 항상 내려준다.
 */
public record PageResponse<T>(List<T> data, PageMeta meta) {

    public static <T> PageResponse<T> from(Page<T> page) {
        PageMeta meta = new PageMeta(page.getNumber(), page.getSize(), page.getTotalElements());
        return new PageResponse<>(page.getContent(), meta);
    }

    public record PageMeta(int page, int size, long total) {}
}
