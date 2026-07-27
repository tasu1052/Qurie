package com.roma.qurie.master;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MasterRepository extends JpaRepository<Master, Long> {

    Optional<Master> findByEmail(String email);
}
