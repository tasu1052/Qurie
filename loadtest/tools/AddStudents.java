import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import org.springframework.security.crypto.bcrypt.BCrypt;

/** 부하 테스트 학생 계정을 studentN@test.com 까지 채워 넣는다(이미 있으면 건너뜀). */
public class AddStudents {

	static final String URL = System.getProperty("url",
			"jdbc:mysql://localhost:3306/qurie?serverTimezone=Asia/Seoul&characterEncoding=UTF-8"
			+ "&allowPublicKeyRetrieval=true&useSSL=false");
	static final String USER = System.getProperty("dbuser", "root");
	static final String PASS = System.getProperty("dbpass", "ssafy");

	public static void main(String[] args) throws Exception {
		int target = Integer.getInteger("students", 100);
		try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {
			conn.setAutoCommit(false);
			Long ent = queryLong(conn, "SELECT id FROM enterprises WHERE name = 'LoadTest Enterprise'");
			Long cls = queryLong(conn, "SELECT id FROM classes WHERE name = 'LoadTest-Class'");
			if (ent == null || cls == null) {
				System.err.println("[FAIL] seed 데이터가 없습니다. Seed.java 를 먼저 실행하세요.");
				System.exit(1);
			}
			String hash = BCrypt.hashpw("password123!", BCrypt.gensalt());
			int created = 0;
			for (int i = 1; i <= target; i++) {
				String email = "student" + i + "@test.com";
				Long userId = queryLong(conn, "SELECT id FROM ordinary_users WHERE email = '" + email + "'");
				if (userId == null) {
					try (PreparedStatement ps = conn.prepareStatement(
							"INSERT INTO ordinary_users (enterprise_id, email, role, password, name, "
							+ "created_at, updated_at) VALUES (?, ?, 'STUDENT', ?, ?, NOW(), NOW())",
							Statement.RETURN_GENERATED_KEYS)) {
						ps.setLong(1, ent);
						ps.setString(2, email);
						ps.setString(3, hash);
						ps.setString(4, "Student " + i);
						ps.executeUpdate();
						try (ResultSet rs = ps.getGeneratedKeys()) {
							rs.next();
							userId = rs.getLong(1);
						}
					}
					created++;
				}
				Long member = queryLong(conn, "SELECT id FROM class_users WHERE class_id = " + cls
						+ " AND user_id = " + userId);
				if (member == null) {
					try (Statement st = conn.createStatement()) {
						st.executeUpdate("INSERT INTO class_users (class_id, user_id, created_at, updated_at) "
								+ "VALUES (" + cls + ", " + userId + ", NOW(), NOW())");
					}
				}
			}
			conn.commit();
			Long total = queryLong(conn, "SELECT COUNT(*) FROM class_users WHERE class_id = " + cls);
			System.out.println("[OK] created " + created + " new students. class members total = " + total);
		}
	}

	static Long queryLong(Connection conn, String sql) throws Exception {
		try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
			return rs.next() ? rs.getLong(1) : null;
		}
	}
}
