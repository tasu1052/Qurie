package com.roma.qurie.session.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.dto.ChatMessageResponse;
import com.roma.qurie.session.chat.dto.ChatSendRequest;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

	private static final Long SESSION_ID = 1L;
	private static final AuthUser SENDER =
			new AuthUser(10L, "STUDENT", 100L, "student@qurie.com", "학생", null);

	@Mock
	private ChatMessageRepository chatMessageRepository;

	@InjectMocks
	private ChatService chatService;

	@Test
	void sendSavesTrimmedMessageWithAuthenticatedSender() {
		given(chatMessageRepository.save(any(ChatMessage.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		ChatMessageResponse response =
				chatService.send(SESSION_ID, SENDER, new ChatSendRequest("  안녕하세요  "));

		ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
		verify(chatMessageRepository).save(captor.capture());
		ChatMessage saved = captor.getValue();
		assertThat(saved.getSessionId()).isEqualTo(SESSION_ID);
		assertThat(saved.getSenderId()).isEqualTo(SENDER.id());
		assertThat(saved.getSenderName()).isEqualTo(SENDER.name());
		assertThat(saved.getContent()).isEqualTo("안녕하세요");
		assertThat(response.content()).isEqualTo("안녕하세요");
	}

	@Test
	void getMessagesUsesBeforeIdCursor() {
		ChatMessage olderMessage = new ChatMessage(SESSION_ID, SENDER.id(), SENDER.name(), "이전 메시지");
		given(chatMessageRepository.findBySessionIdAndIdLessThanOrderByIdDesc(
				org.mockito.ArgumentMatchers.eq(SESSION_ID),
				org.mockito.ArgumentMatchers.eq(50L),
				any(Pageable.class)))
				.willReturn(List.of(olderMessage));

		List<ChatMessageResponse> responses =
				chatService.getMessages(SESSION_ID, 50L, 20);

		assertThat(responses).extracting(ChatMessageResponse::content).containsExactly("이전 메시지");
	}

	@Test
	void deleteBySessionRemovesEveryMessageOfSession() {
		given(chatMessageRepository.deleteBySessionId(SESSION_ID)).willReturn(3L);

		assertThat(chatService.deleteBySession(SESSION_ID)).isEqualTo(3L);
		verify(chatMessageRepository).deleteBySessionId(SESSION_ID);
	}

	@Test
	void getMessagesRejectsSizeOverMaximum() {
		assertThatThrownBy(() -> chatService.getMessages(SESSION_ID, null, 101))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}
}
