import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * 리포트 시나리오(04) 재측정 전 초기화 — 부하테스트 세션에 발급된 session_reports 만 지운다.
 * 집계 원본인 quiz_progress 는 남긴다(리포트 측정에는 응시 기록이 있어야 의미가 있다).
 * -Durl/-Ddbuser/-Ddbpass 로 대상 DB 를 바꾼다.
 */
public class ResetReports {

	static final String URL = System.getProperty("url",
			"jdbc:mysql://localhost:3306/qurie?allowPublicKeyRetrieval=true&useSSL=false");
	static final String USER = System.getProperty("dbuser", "root");
	static final String PASS = System.getProperty("dbpass", "ssafy");

	public static void main(String[] args) throws Exception {
		try (Connection conn = DriverManager.getConnection(URL, USER, PASS);
				Statement st = conn.createStatement()) {
			Long sessionId;
			try (ResultSet rs = st.executeQuery(
					"SELECT id FROM sessions WHERE title = 'LoadTest Session' ORDER BY id DESC LIMIT 1")) {
				sessionId = rs.next() ? rs.getLong(1) : null;
			}
			if (sessionId == null) {
				System.err.println("[FAIL] LoadTest Session 이 없습니다. Seed.java 를 먼저 실행하세요.");
				System.exit(1);
			}
			int deleted = st.executeUpdate("DELETE FROM session_reports WHERE session_id = " + sessionId);
			System.out.println("[OK] session " + sessionId + " reports deleted rows: " + deleted);
		}
	}
}
