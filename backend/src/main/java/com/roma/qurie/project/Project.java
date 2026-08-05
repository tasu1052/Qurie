package com.roma.qurie.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 프로젝트 엔티티. 하나의 세션(방) 안으로 가져온 코드 프로젝트를 나타낸다.
 * path 는 Git 연동 방식이 확정되지 않아 nullable 로 열어둔다.
 * session_id, imported_by 는 아직 엔티티가 없어 FK 값(Long) 으로만 보관한다.
 */
@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    /** 프로젝트 경로. Git 연동 미확정으로 값이 없을 수 있다. */
    @Column(name = "path", length = 500)
    private String path;

    @Column(name = "imported_by", nullable = false)
    private Long importedBy;

    /** 임포트 파일 내용 SHA-256. 퀴즈 version_hash · 참가자 동기화에 쓴다. */
    @Column(name = "version_hash", length = 64)
    private String versionHash;

    @Column(name = "file_count")
    private Integer fileCount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Project(
        Long sessionId,
        String path,
        Long importedBy
    ) {
        this.sessionId = sessionId;
        this.path = path;
        this.importedBy = importedBy;
    }

    public Project(
        Long sessionId,
        String path,
        Long importedBy,
        String versionHash,
        int fileCount
    ) {
        this(sessionId, path, importedBy);
        this.versionHash = versionHash;
        this.fileCount = fileCount;
    }

    /** 파일 저장으로 스냅샷 내용이 바뀌면 해시도 함께 갱신해야 퀴즈 version_hash 가 실제 코드와 일치한다. */
    public void updateVersionHash(String versionHash) {
        this.versionHash = versionHash;
    }
}
