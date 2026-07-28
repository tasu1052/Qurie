package com.roma.qurie.analytics;

import com.roma.qurie.analytics.dto.AnalyticsOverviewResponse;
import com.roma.qurie.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** 마스터 대시보드 상단 KPI 4종 (MASTER) */
    @GetMapping("/overview")
    public AnalyticsOverviewResponse getOverview(@AuthenticationPrincipal AuthUser requester) {
        return analyticsService.getOverview(requester);
    }
}
