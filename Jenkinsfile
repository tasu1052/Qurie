// 백엔드 CI/CD. GitLab master 푸시 → 테스트 → 이미지 빌드 → 재기동 → 헬스체크.
//
// 빌드를 Jenkins 워크스페이스가 아니라 DEPLOY_DIR 에서 하는 이유:
// Jenkins 는 호스트의 docker 데몬을 공유해 쓰고, docker build 의 컨텍스트 경로는 그 호스트 데몬이
// 해석한다. 워크스페이스(/var/jenkins_home/...)는 호스트에 그 경로로 존재하지 않아 빌드가 실패한다.
// DEPLOY_DIR 만 호스트와 같은 경로로 마운트해 두고 거기서 빌드한다.
/**
 * 매터모스트 알림. Incoming Webhook URL 은 Jenkins 자격증명(Secret text, ID: mattermost-webhook)에 둔다.
 * 플러그인을 쓰지 않는 이유는 메시지 형식을 직접 잡을 수 있고 의존이 줄기 때문이다.
 *
 * 마크다운 헤딩(##)을 쓰지 않는다. 매터모스트에서 글자가 과하게 커져 채널을 잡아먹는다.
 * 머지마다 백엔드/프론트 알림이 각각 오므로 한 건은 두 줄 안쪽으로 유지한다.
 */
def notifyMattermost(boolean success) {
	String head = success
			? ':white_check_mark: **백엔드 배포 성공**'
			: ':x: **백엔드 배포 실패**'
	String commit = sh(script: "git -C '${env.DEPLOY_DIR}' log -1 --pretty='%h %s'", returnStdout: true).trim()

	List<String> lines = [
			"${head} · `master` · [#${env.BUILD_NUMBER}](${env.BUILD_URL})",
			"`${commit}`",
	]
	if (!success) {
		lines << '위 빌드 링크의 Console Output 을 볼 것'
	}

	// 한글과 개행이 섞이므로 셸 인용을 피해 파일로 만들어 보낸다.
	writeFile file: 'mm-payload.json', text: groovy.json.JsonOutput.toJson([
			text: lines.join('\n'),
			username: 'Jenkins',
	])

	// 작은따옴표 문자열이라 $MM_WEBHOOK 은 Groovy 가 아니라 셸이 치환한다.
	// 큰따옴표로 바꾸면 웹훅 URL 이 콘솔 로그에 그대로 노출된다.
	withCredentials([string(credentialsId: 'mattermost-webhook', variable: 'MM_WEBHOOK')]) {
		sh(script: '''
			curl -sS -f -X POST -H 'Content-Type: application/json' \
				--data-binary @mm-payload.json "$MM_WEBHOOK" || true
		''')
	}
}

pipeline {
	agent any

	environment {
		DEPLOY_DIR = '/home/ubuntu/S15P11A604'
		// 이 스텝은 Jenkins 컨테이너 안에서 돈다. 컨테이너의 127.0.0.1 은 호스트가 아니고,
		// 백엔드는 호스트 루프백에만 바인딩되어 있어 브리지 주소로도 닿지 않는다.
		// 공개 URL 로 확인하면 nginx 까지 포함한 실제 사용자 경로를 검증하게 된다.
		HEALTH_URL = 'https://i15a604.p.ssafy.io/api/auth/me'
		// 볼륨 안에 두어 빌드마다 의존성을 다시 받지 않게 한다.
		GRADLE_USER_HOME = '/var/jenkins_home/.gradle'
	}

	options {
		timeout(time: 30, unit: 'MINUTES')
		// 같은 서버의 같은 컨테이너를 건드리므로 동시 실행을 막는다.
		disableConcurrentBuilds()
		buildDiscarder(logRotator(numToKeepStr: '20'))
	}

	stages {
		stage('Checkout') {
			steps {
				sh '''
					# Jenkins 는 root 로 돌고 배포 디렉터리는 ubuntu 소유다. git 이 소유자 불일치를
					# dubious ownership 으로 거부하므로 예외를 등록한다(--replace-all 로 중복 누적 방지).
					git config --global --replace-all safe.directory "$DEPLOY_DIR"

					cd "$DEPLOY_DIR"
					git fetch --prune origin master
					git checkout master
					git reset --hard origin/master
					git log -1 --oneline
				'''
			}
		}

		stage('Test') {
			steps {
				// QurieApplicationTests(컨텍스트 로딩)는 DB 가 있어야 통과하므로 제외한다.
				// 클래스명이 Test 로 끝나는 단위 테스트 64개만 돌린다.
				sh 'cd "$DEPLOY_DIR/backend" && ./gradlew --no-daemon test --tests "*Test"'
			}
			post {
				always {
					// junit 스텝은 워크스페이스 안의 경로만 읽어서 결과를 옮겨온다.
					sh 'rm -rf "$WORKSPACE/test-results" && cp -r "$DEPLOY_DIR/backend/build/test-results/test" "$WORKSPACE/test-results" || true'
					junit allowEmptyResults: true, testResults: 'test-results/*.xml'
				}
			}
		}

		stage('Deploy') {
			steps {
				sh 'bash "$DEPLOY_DIR/scripts/deploy.sh"'
			}
		}
	}

	post {
		failure {
			sh 'cd "$DEPLOY_DIR" && docker compose logs --tail 50 backend || true'
			notifyMattermost(false)
		}
		success {
			notifyMattermost(true)
		}
	}
}
