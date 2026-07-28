package com.roma.qurie.classes;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    boolean existsByTrackIdAndClassNumber(Long trackId, int classNumber);
}
