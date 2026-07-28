package com.roma.qurie.invitation;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {

	Optional<Invitation> findByTokenHash(String tokenHash);
}
