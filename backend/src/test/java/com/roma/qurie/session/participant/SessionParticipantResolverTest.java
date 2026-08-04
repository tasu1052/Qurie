package com.roma.qurie.session.participant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.List;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.user.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SessionParticipantResolverTest {

	@Mock
	private GroupParticipantRepository groupParticipantRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private Session session;

	@InjectMocks
	private SessionParticipantResolver resolver;

	@Test
	void 그룹_세션은_그룹_편성에서_참여_학생을_해석한다() {
		given(session.getGroupId()).willReturn(3L);
		given(groupParticipantRepository.findUserIdsByGroupIdAndUserRole(3L, UserRole.STUDENT))
				.willReturn(List.of(7L, 8L));

		assertThat(resolver.resolveStudentIds(session)).containsExactly(7L, 8L);
		assertThat(resolver.isParticipantStudent(session, 7L)).isTrue();
		assertThat(resolver.isParticipantStudent(session, 99L)).isFalse();
		verifyNoInteractions(classUserRepository);
	}

	@Test
	void 반_공개_세션은_반_명단에서_참여_학생을_해석한다() {
		given(session.getGroupId()).willReturn(null);
		given(session.getClassId()).willReturn(9L);
		given(classUserRepository.findUserIdsByClassEntityIdAndUserRole(9L, UserRole.STUDENT))
				.willReturn(List.of(7L));

		assertThat(resolver.resolveStudentIds(session)).containsExactly(7L);
		assertThat(resolver.isParticipantStudent(session, 7L)).isTrue();
		verifyNoInteractions(groupParticipantRepository);
	}
}
