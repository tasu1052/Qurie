// 백엔드 CI/CD. GitLab master 푸시 → 테스트 → 이미지 빌드 → 재기동 → 헬스체크.
//
// 빌드를 Jenkins 워크스페이스가 아니라 DEPLOY_DIR 에서 하는 이유:
// Jenkins 는 호스트의 docker 데몬을 공유해 쓰고, docker build 의 컨텍스트 경로는 그 호스트 데몬이
// 해석한다. 워크스페이스(/var/jenkins_home/...)는 호스트에 그 경로로 존재하지 않아 빌드가 실패한다.
// DEPLOY_DIR 만 호스트와 같은 경로로 마운트해 두고 거기서 빌드한다.
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
		}
	}
}
