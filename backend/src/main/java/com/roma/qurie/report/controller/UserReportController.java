package com.roma.qurie.report.controller;

import com.roma.qurie.report.dto.UserReportCreateRequest;
import com.roma.qurie.report.dto.UserReportCreateResponse;
import com.roma.qurie.report.service.UserReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserReportController {

    private final UserReportService userReportService;

    /**
     * todo: API 설계안(v0.1)은 report-summary를 저장하지 않는 GET 집계 리소스로 정의한다.
     *       user_reports 테이블을 유지할지 확정되면 이 엔드포인트도 함께 정리해야 한다.
     * todo: 집계 수치는 session_reports에서 서버가 계산하도록 옮긴다.
     *
     * @param ordinaryUserId: 최종 리포트를 발급할 사용자 id
     * @param request: 클래스 id와 누적 집계 수치
     */
    @PostMapping("/{userId}/report-summary")
    @ResponseStatus(HttpStatus.CREATED)
    public UserReportCreateResponse createUserReport(@PathVariable("userId") Long ordinaryUserId,
            @Valid @RequestBody UserReportCreateRequest request) {
        return userReportService.createUserReport(ordinaryUserId, request);
    }
}
