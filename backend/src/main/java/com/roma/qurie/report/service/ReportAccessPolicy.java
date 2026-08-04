package com.roma.qurie.report.service;

import com.roma.qurie.security.AuthUser;

/**
 * 리포트 조회 권한: 본인이거나 매니저/마스터. 세션/유저 리포트가 같은 기준을 쓰도록 모아 둔다.
 * 반 소속 대조는 리소스를 읽어야 판단할 수 있어 호출부의 검증에 위임한다.
 */
final class ReportAccessPolicy {

    private static final String MASTER_ROLE = "MASTER";
    private static final String MANAGER_ROLE = "MANAGER";

    private ReportAccessPolicy() {
    }

    static boolean canView(AuthUser requester, Long targetUserId) {
        if (requester.id().equals(targetUserId)) {
            return true;
        }
        return MASTER_ROLE.equals(requester.role()) || MANAGER_ROLE.equals(requester.role());
    }
}
