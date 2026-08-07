import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import org.springframework.security.crypto.bcrypt.BCrypt;

/**
 * k6 부하 테스트용 시드 데이터 생성기.
 * enterprise > track > class > (teacher + student1..N) > active session > project(30 files)
 * > COMPLETED quiz_set(20 quizzes x 4 choices) 를 만든다.
 * teacher@test.com 이 이미 있으면 아무것도 만들지 않고 기존 id 들만 출력한다.
 */
public class Seed {

	/** -Durl / -Ddbuser / -Ddbpass 로 대상 DB 를 바꾼다 (기본: 로컬). EC2 는 SSH 터널로 13306 을 연결해 쓴다. */
	static final String URL = System.getProperty("url",
			"jdbc:mysql://localhost:3306/qurie?serverTimezone=Asia/Seoul&characterEncoding=UTF-8"
			+ "&allowPublicKeyRetrieval=true&useSSL=false");
	static final String USER = System.getProperty("dbuser", "root");
	static final String PASS = System.getProperty("dbpass", "ssafy");
	static final int STUDENTS = Integer.getInteger("students", 30);
	static final int FILES = 30;
	static final int QUIZZES = 20;

	public static void main(String[] args) throws Exception {
		try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {
			for (String table : new String[] {"enterprises", "tracks", "classes", "ordinary_users",
					"class_users", "sessions", "projects", "project_files", "quiz_set", "quiz", "quiz_choice"}) {
				requireTable(conn, table);
			}

			Long teacher = queryLong(conn, "SELECT id FROM ordinary_users WHERE email = 'teacher@test.com'");
			if (teacher != null) {
				System.out.println("[SKIP] teacher@test.com already exists. Existing ids:");
				printIds(conn);
				return;
			}

			conn.setAutoCommit(false);
			String hash = BCrypt.hashpw("password123!", BCrypt.gensalt());

			long ent = insert(conn, "INSERT INTO enterprises (name, created_at, updated_at) "
					+ "VALUES ('LoadTest Enterprise', NOW(), NOW())");
			long track = insert(conn, "INSERT INTO tracks (enterprise_id, name, description, tech, created_at, updated_at) "
					+ "VALUES (" + ent + ", 'LoadTest Track', 'k6 load test', 'JAVA', NOW(), NOW())");
			long cls = insert(conn, "INSERT INTO classes (track_id, class_number, name, capacity, description, "
					+ "started_at, ended_at, created_at, updated_at) "
					+ "VALUES (" + track + ", 999, 'LoadTest-Class', 100, 'k6 load test', NOW(), NULL, NOW(), NOW())");

			teacher = insertUser(conn, ent, "teacher@test.com", "MANAGER", hash, "LoadTest Teacher");
			addToClass(conn, cls, teacher);
			for (int i = 1; i <= STUDENTS; i++) {
				long student = insertUser(conn, ent, "student" + i + "@test.com", "STUDENT", hash, "Student " + i);
				addToClass(conn, cls, student);
			}

			long session = insert(conn, "INSERT INTO sessions (class_id, group_id, title, created_by, "
					+ "is_active, is_class_public, created_at, ended_at, updated_at) "
					+ "VALUES (" + cls + ", NULL, 'LoadTest Session', " + teacher + ", 1, 1, NOW(), NULL, NOW())");

			String versionHash = "a".repeat(64);
			long project = insert(conn, "INSERT INTO projects (session_id, path, imported_by, version_hash, "
					+ "file_count, created_at, updated_at) "
					+ "VALUES (" + session + ", NULL, " + teacher + ", '" + versionHash + "', " + FILES + ", NOW(), NOW())");

			try (PreparedStatement ps = conn.prepareStatement("INSERT INTO project_files "
					+ "(project_id, path, content, byte_size, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())")) {
				for (int i = 1; i <= FILES; i++) {
					String content = javaFile(i);
					ps.setLong(1, project);
					ps.setString(2, String.format("src/main/java/demo/Service%02d.java", i));
					ps.setString(3, content);
					ps.setLong(4, content.getBytes("UTF-8").length);
					ps.addBatch();
				}
				ps.executeBatch();
			}

			// requested_types 는 현재 엔티티에서 빠진 잔재 컬럼이지만 NOT NULL 이라 값을 채워야 한다.
			long quizSet = insert(conn, "INSERT INTO quiz_set (project_id, version_hash, mode, requested_count, "
					+ "requested_types, ratio_easy, ratio_normal, ratio_hard, user_prompt, status, generated_count, "
					+ "error_message, ai_quiz_set_id, created_by, source_path, source_kind, satisfaction_rating, "
					+ "satisfaction_comment, created_at, updated_at) "
					+ "VALUES (" + project + ", '" + versionHash + "', 'ASSESSMENT', " + QUIZZES + ", "
					+ "'[\"MULTIPLE_CHOICE\"]', 30, 40, 30, NULL, "
					+ "'COMPLETED', " + QUIZZES + ", NULL, NULL, " + teacher + ", 'src/main/java/demo', 'dir', "
					+ "NULL, NULL, NOW(), NOW())");

			for (int q = 1; q <= QUIZZES; q++) {
				long quiz = insert(conn, "INSERT INTO quiz (quiz_set_id, type, purpose, difficulty, tested_concept, "
						+ "question, answer_text, explanation, file_path, line_start, line_end, time_limit_sec, "
						+ "order_no, status, judge_score, reject_reason, gen_model, embedding, created_at, updated_at) "
						+ "VALUES (" + quizSet + ", 'MULTIPLE_CHOICE', 'CONCEPTUAL', 'NORMAL', 'load-test-concept', "
						+ "'Q" + q + ". What does Service" + String.format("%02d", q) + ".process() return for input n?', "
						+ "'n * 2', 'It doubles the input.', 'src/main/java/demo/Service"
						+ String.format("%02d", Math.min(q, FILES)) + ".java', 5, 12, 30, " + q + ", 'DRAFT', "
						+ "NULL, NULL, 'seed', NULL, NOW(), NOW())");
				int answer = q % 4;
				try (PreparedStatement ps = conn.prepareStatement(
						"INSERT INTO quiz_choice (quiz_id, idx, content, is_answer) VALUES (?, ?, ?, ?)")) {
					for (int idx = 0; idx < 4; idx++) {
						ps.setLong(1, quiz);
						ps.setInt(2, idx);
						ps.setString(3, "Choice " + idx + " for Q" + q);
						ps.setBoolean(4, idx == answer);
						ps.addBatch();
					}
					ps.executeBatch();
				}
			}

			conn.commit();
			System.out.println("[OK] seed complete: 1 teacher + " + STUDENTS + " students, class " + cls);
			printIds(conn);
		}
	}

	static String javaFile(int index) {
		StringBuilder sb = new StringBuilder();
		sb.append("package demo;\n\n");
		sb.append("/** k6 load-test fixture file #").append(index).append(" */\n");
		sb.append(String.format("public class Service%02d {%n", index));
		sb.append("\tpublic int process(int n) {\n\t\treturn n * 2;\n\t}\n\n");
		for (int m = 0; m < 20; m++) {
			sb.append(String.format("\tpublic int helper%d(int n) {%n\t\treturn n + %d;%n\t}%n%n", m, m));
		}
		sb.append("}\n");
		return sb.toString();
	}

	static long insertUser(Connection conn, long enterpriseId, String email, String role, String hash, String name)
			throws Exception {
		try (PreparedStatement ps = conn.prepareStatement("INSERT INTO ordinary_users (enterprise_id, email, role, "
				+ "password, name, phone, region, gender, theme, created_at, updated_at) "
				+ "VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NOW(), NOW())", Statement.RETURN_GENERATED_KEYS)) {
			ps.setLong(1, enterpriseId);
			ps.setString(2, email);
			ps.setString(3, role);
			ps.setString(4, hash);
			ps.setString(5, name);
			ps.executeUpdate();
			try (ResultSet rs = ps.getGeneratedKeys()) {
				rs.next();
				return rs.getLong(1);
			}
		}
	}

	static void addToClass(Connection conn, long classId, long userId) throws Exception {
		insert(conn, "INSERT INTO class_users (class_id, user_id, created_at, updated_at) "
				+ "VALUES (" + classId + ", " + userId + ", NOW(), NOW())");
	}

	static long insert(Connection conn, String sql) throws Exception {
		try (Statement st = conn.createStatement()) {
			st.executeUpdate(sql, Statement.RETURN_GENERATED_KEYS);
			try (ResultSet rs = st.getGeneratedKeys()) {
				return rs.next() ? rs.getLong(1) : -1;
			}
		}
	}

	static Long queryLong(Connection conn, String sql) throws Exception {
		try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
			return rs.next() ? rs.getLong(1) : null;
		}
	}

	static void requireTable(Connection conn, String table) throws Exception {
		Long found = queryLong(conn, "SELECT COUNT(*) FROM information_schema.tables "
				+ "WHERE table_schema = 'qurie' AND table_name = '" + table + "'");
		if (found == null || found == 0) {
			System.err.println("[FAIL] table '" + table + "' not found. Run the Spring Boot server once first "
					+ "(ddl-auto=update creates tables), then run this seeder again.");
			System.exit(1);
		}
	}

	static void printIds(Connection conn) throws Exception {
		Long cls = queryLong(conn, "SELECT id FROM classes WHERE name = 'LoadTest-Class'");
		Long session = queryLong(conn, "SELECT id FROM sessions WHERE title = 'LoadTest Session' ORDER BY id DESC LIMIT 1");
		Long project = queryLong(conn, "SELECT id FROM projects WHERE session_id = " + session + " ORDER BY id DESC LIMIT 1");
		Long quizSet = queryLong(conn, "SELECT id FROM quiz_set WHERE project_id = " + project + " ORDER BY id DESC LIMIT 1");
		System.out.println("CLASS_ID=" + cls);
		System.out.println("SESSION_ID=" + session);
		System.out.println("PROJECT_ID=" + project);
		System.out.println("QUIZ_SET_ID=" + quizSet);
		System.out.println("INSTRUCTOR_EMAIL=teacher@test.com  PASSWORD=password123!");
		System.out.println("STUDENTS=student1..N@test.com (same password)");
	}
}
