package com.roma.qurie.classes;

import com.roma.qurie.classes.dto.ClassCreateRequest;
import com.roma.qurie.classes.dto.ClassMemberResponse;
import com.roma.qurie.classes.dto.ClassResponse;
import com.roma.qurie.classes.dto.ClassUpdateRequest;
import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.UserRole;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    /** 내가 속한 반 목록. 열린 방 목록을 조회하려면 여기서 classId 를 얻는다. */
    @GetMapping("/me")
    public List<ClassResponse> myClasses(@AuthenticationPrincipal AuthUser authUser) {
        return classService.getMyClasses(authUser);
    }

    /**
     * 클래스 관리 목록 조회 (MASTER, MANAGER)
     *
     * todo: 설계안의 tech(트랙 속성)·status(진행 상태) 필터는 화면 작업 시 추가.
     */
    @GetMapping
    public PageResponse<ClassResponse> list(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(name = "trackId", required = false) Long trackId,
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return classService.getClasses(authUser, trackId, keyword, pageable);
    }

    /** 클래스 상세 조회 (MASTER, MANAGER, 소속 STUDENT) */
    @GetMapping("/{classId}")
    public ClassResponse get(@AuthenticationPrincipal AuthUser authUser, @PathVariable("classId") Long classId) {
        return classService.getClass(authUser, classId);
    }

    /**
     * 반 명단 조회 (MASTER, 담당 MANAGER). 매니저 학생 관리 화면은 role=STUDENT 로 학생만 조회한다.
     * 전체 회원 조회(GET /api/users)와 달리 반 소속(class_users)으로 범위가 잘린다.
     */
    @GetMapping("/{classId}/users")
    public PageResponse<ClassMemberResponse> members(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("classId") Long classId,
            @RequestParam(name = "role", required = false) UserRole role,
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return classService.getMembers(authUser, classId, role, keyword, pageable);
    }

    /** 클래스 수정 (MASTER, 담당 MANAGER) — PATCH 부분 수정 */
    @PatchMapping("/{classId}")
    public ClassResponse update(@AuthenticationPrincipal AuthUser authUser,
            @PathVariable("classId") Long classId, @Valid @RequestBody ClassUpdateRequest request) {
        return classService.update(authUser, classId, request);
    }

    /** 클래스 삭제 (MASTER). 세션·그룹이 있으면 409 */
    @DeleteMapping("/{classId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthUser authUser, @PathVariable("classId") Long classId) {
        classService.delete(authUser, classId);
        return ResponseEntity.noContent().build();
    }
}
