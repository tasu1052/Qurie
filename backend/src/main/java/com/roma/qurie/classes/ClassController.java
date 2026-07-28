package com.roma.qurie.classes;

import com.roma.qurie.classes.dto.ClassCreateRequest;
import com.roma.qurie.classes.dto.ClassResponse;
import com.roma.qurie.security.AuthUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;

    /** 클래스 생성 (MASTER) */
    @PostMapping
    public ResponseEntity<ClassResponse> create(
            @AuthenticationPrincipal AuthUser authUser, @Valid @RequestBody ClassCreateRequest request) {
        ClassResponse response = classService.create(authUser, request);
        return ResponseEntity.created(URI.create("/api/classes/" + response.id())).body(response);
    }
}
