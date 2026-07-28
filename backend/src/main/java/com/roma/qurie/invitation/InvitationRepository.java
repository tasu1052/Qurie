package com.roma.qurie.invitation;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByToken(String token);

    List<Invitation> findByEnterpriseIdAndRole(Long enterpriseId, InvitationRole role);

    List<Invitation> findByInvitedByUserId(Long userId);

    Optional<Invitation> findFirstByEmailAndRoleAndStatus(String email, InvitationRole role, InvitationStatus status);
}
