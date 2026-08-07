import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * k6 재측정 전 초기화 — 부하테스트 퀴즈셋의 응시 기록만 지운다.
 * 대상 퀴즈셋은 'LoadTest Session' 세션에 매달린 최신 퀴즈셋으로 자동 식별하므로
 * 시연/운영 데이터는 건드리지 않는다. -Durl/-Ddbuser/-Ddbpass 로 대상 DB 를 바꾼다.
 */
public class Reset {

	static final String URL = System.getProperty("url",
			"jdbc:mysql://localhost:3306/qurie?allowPublicKeyRetrieval=true&useSSL=false");
	static final String USER = System.getProperty("dbuser", "root");
	static final String PASS = System.getProperty("dbpass", "ssafy");

	public static void main(String[] args) throws Exception {
		try (Connection conn = DriverManager.getConnection(URL, USER, PASS);
				Statement st = conn.createStatement()) {
			Long quizSetId;
			try (ResultSet rs = st.executeQuery(
					"SELECT qs.id FROM quiz_set qs "
					+ "JOIN projects p ON qs.project_id = p.id "
					+ "JOIN sessions s ON p.session_id = s.id "
					+ "WHERE s.title = 'LoadTest Session' ORDER BY qs.id DESC LIMIT 1")) {
				quizSetId = rs.next() ? rs.getLong(1) : null;
			}
			if (quizSetId == null) {
				System.err.println("[FAIL] LoadTest Session 의 퀴즈셋을 찾지 못했습니다. Seed.java 를 먼저 실행하세요.");
				System.exit(1);
			}
			int deleted = st.executeUpdate("DELETE qp FROM quiz_progress qp "
					+ "JOIN quiz q ON qp.quiz_id = q.id WHERE q.quiz_set_id = " + quizSetId);
			System.out.println("[OK] quiz_set " + quizSetId + " progress deleted rows: " + deleted);
		}
	}
}
