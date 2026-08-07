# k6 부하테스트용 DB 도구 실행기 (Seed: 시드 생성, Reset: 응시기록 초기화, AddStudents: 학생 확장)
#
# 로컬 DB (기본값):
#   .\db-tool.ps1 Seed
#   .\db-tool.ps1 Reset
#   .\db-tool.ps1 AddStudents -Students 100
#
# EC2 DB (SSH 터널 13306 을 먼저 열어둘 것):
#   ssh -i <키.pem> -N -L 13306:127.0.0.1:13306 ubuntu@i15a604.p.ssafy.io
#   .\db-tool.ps1 Seed -Ec2 -DbPass <EC2의 MYSQL_ROOT_PASSWORD>
param(
	[Parameter(Mandatory = $true)][ValidateSet('Seed', 'Reset', 'AddStudents')][string]$Tool,
	[switch]$Ec2,
	[string]$DbUrl,
	[string]$DbUser = 'root',
	[string]$DbPass = 'ssafy',
	[int]$Students = 0
)
$ErrorActionPreference = 'Stop'

if ($Ec2 -and -not $DbUrl) {
	$DbUrl = 'jdbc:mysql://127.0.0.1:13306/qurie?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true&useSSL=false'
}

$java = Join-Path $env:USERPROFILE '.jdks\ms-17.0.20\bin\java.exe'
if (-not (Test-Path $java)) { $java = 'java' }

# 드라이버/BCrypt jar 는 백엔드 빌드가 받아둔 gradle 캐시에서 찾는다 (버전 무관 glob).
$cacheRoot = Join-Path $env:USERPROFILE '.gradle\caches\modules-2\files-2.1'
$mysqlJar = Get-ChildItem (Join-Path $cacheRoot 'com.mysql\mysql-connector-j') -Recurse -Filter '*.jar' |
	Where-Object Name -NotMatch 'sources' | Select-Object -First 1
$cryptoJar = Get-ChildItem (Join-Path $cacheRoot 'org.springframework.security\spring-security-crypto') -Recurse -Filter '*.jar' |
	Where-Object Name -NotMatch 'sources' | Select-Object -First 1
if (-not $mysqlJar) { throw 'gradle 캐시에 mysql-connector-j 가 없습니다. backend 를 한 번 빌드하세요 (gradlew compileJava).' }

$jvmArgs = @("-Ddbuser=$DbUser", "-Ddbpass=$DbPass")
if ($DbUrl) { $jvmArgs += "-Durl=$DbUrl" }
if ($Students -gt 0) { $jvmArgs += "-Dstudents=$Students" }

& $java --class-path "$($mysqlJar.FullName);$($cryptoJar.FullName)" @jvmArgs (Join-Path $PSScriptRoot "$Tool.java")
