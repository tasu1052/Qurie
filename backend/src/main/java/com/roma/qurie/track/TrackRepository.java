package com.roma.qurie.track;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackRepository extends JpaRepository<Track, Long> {

    boolean existsByEnterpriseIdAndName(Long enterpriseId, String name);
}
