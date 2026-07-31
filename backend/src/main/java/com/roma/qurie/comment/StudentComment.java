package com.roma.qurie.comment;

import com.roma.qurie.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 강사가 학생 상세 화면에서 남기는 코멘트. AI 가 만드는 리포트의 ai_comment 와 달리 사람이 쓴 기록이라
 * 리포트에 넣지 않고 따로 쌓는다 — 리포트는 세션·집계 단위로 다시 만들어지지만 코멘트는 누적 이력이다.
 *
 * 반(classId)을 함께 들고 있는 이유는 권한 판정이다. 코멘트는 "그 반의 강사"만 쓰고 볼 수 있어야 하는데,
 * 학생이 반을 옮기면 과거 코멘트의 소속 반을 사후에 알 수 없다.
 */
@Entity
@Table(name = "student_comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentComment extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "ordinary_user_id", nullable = false)
	private Long ordinaryUserId;

	@Column(name = "class_id", nullable = false)
	private Long classId;

	@Column(name = "author_id", nullable = false)
	private Long authorId;

	/**
	 * 작성 시점의 작성자 이름. 조회마다 users 를 조회하지 않기 위해 저장한다(session_chat_messages 와 같은 선택).
	 * 작성자가 이름을 바꾸면 과거 코멘트에는 옛 이름이 남는다.
	 */
	@Column(name = "author_name", nullable = false, length = 50)
	private String authorName;

	@Column(name = "content", nullable = false, columnDefinition = "text")
	private String content;

	public StudentComment(Long ordinaryUserId, Long classId, Long authorId, String authorName, String content) {
		this.ordinaryUserId = ordinaryUserId;
		this.classId = classId;
		this.authorId = authorId;
		this.authorName = authorName;
		this.content = content;
	}

	public void changeContent(String content) {
		this.content = content;
	}
}
