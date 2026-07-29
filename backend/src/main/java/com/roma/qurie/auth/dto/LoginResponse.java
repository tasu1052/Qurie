package com.roma.qurie.auth.dto;

import com.roma.qurie.security.AuthUser;

public record LoginResponse(Long id, String name, String email, String role, Long enterpriseId, Long classId) {

    public static LoginResponse from(AuthUser authUser) {
        return new LoginResponse(
                authUser.id(), authUser.name(), authUser.email(), authUser.role(), authUser.enterpriseId(),
                authUser.classId());
    }
}
