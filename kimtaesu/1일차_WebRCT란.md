# WebRTC 정리

## 1. WebRTC란?

**WebRTC(Web Real-Time Communication)**는 별도의 프로그램이나 플러그인을 설치하지 않고 웹 브라우저 또는 애플리케이션 간에 실시간으로 음성, 영상, 데이터를 주고받을 수 있도록 지원하는 기술이다.

WebRTC를 사용하면 다음과 같은 기능을 구현할 수 있다.

* 화상회의
* 음성 통화
* 화면 공유
* 실시간 채팅
* 온라인 협업
* 원격 교육
* 게임 및 AR 서비스
* IoT 장치 간 실시간 데이터 통신

WebRTC는 주로 피어 간 직접 통신인 **P2P(Peer-to-Peer)** 방식을 사용하지만, 네트워크 환경이나 서비스 구조에 따라 TURN, SFU, MCU와 같은 중계 서버를 사용할 수도 있다.

> WebRTC가 항상 완전한 P2P 방식으로만 동작하는 것은 아니다.
> 방화벽이나 NAT로 인해 직접 연결이 불가능하면 TURN 서버를 통해 데이터를 중계할 수 있으며, 다자간 통신에서는 SFU나 MCU 서버를 사용하는 경우가 많다.

---

## 2. WebRTC 연결에 필요한 요소

두 단말이 WebRTC를 통해 실시간 통신하려면 다음 정보와 과정이 필요하다.

1. 카메라와 마이크 등의 미디어 장치에 접근
2. 상대방과 통신하기 위한 IP 주소와 포트 정보 확인
3. 사용할 미디어 종류와 코덱 등의 통신 조건 협상
4. 연결 가능한 네트워크 경로 탐색
5. 피어 간 연결 생성
6. 연결 후 오디오, 영상 또는 데이터 전송
7. 연결 상태 변화와 오류 처리

WebRTC에서는 이러한 기능을 구현하기 위해 여러 API와 프로토콜을 사용한다.

---

## 3. WebRTC의 주요 API

### 3.1 MediaStream

`MediaStream`은 카메라, 마이크, 화면 공유 등에서 생성되는 미디어 데이터의 흐름을 표현한다.

브라우저에서는 주로 `navigator.mediaDevices.getUserMedia()`를 사용하여 카메라와 마이크에 접근한다.

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});
```

획득한 `MediaStream`은 화면에 표시하거나 상대 피어에게 전송할 수 있다.

주요 역할은 다음과 같다.

* 카메라 영상 획득
* 마이크 음성 획득
* 화면 공유 데이터 획득
* 오디오 및 비디오 트랙 관리

---

### 3.2 RTCPeerConnection

`RTCPeerConnection`은 WebRTC에서 피어 간 연결을 관리하는 핵심 API이다.

주요 역할은 다음과 같다.

* 피어 간 연결 생성
* SDP Offer 및 Answer 생성
* ICE Candidate 수집 및 교환
* 오디오와 비디오 스트림 전송
* 네트워크 상태 확인
* 대역폭 및 전송 품질 관리
* 암호화된 미디어 통신 제공

```javascript
const peerConnection = new RTCPeerConnection(configuration);
```

WebRTC의 음성 및 영상 데이터는 일반적으로 **SRTP**를 사용하여 암호화된다. 암호화에 필요한 키는 **DTLS**를 이용해 안전하게 협상한다.

---

### 3.3 RTCDataChannel

`RTCDataChannel`은 피어 간에 음성이나 영상이 아닌 일반 데이터를 주고받기 위한 API이다.

```javascript
const dataChannel = peerConnection.createDataChannel("chat");
```

다음과 같은 데이터를 전송할 수 있다.

* 채팅 메시지
* 파일
* 게임 상태
* 좌표 및 센서 데이터
* 애플리케이션 제어 메시지

RTCDataChannel은 일반적으로 **SCTP over DTLS** 구조를 사용한다.

TCP와 비슷하게 신뢰성 있는 전송을 사용할 수도 있고, 실시간성을 위해 일부 데이터 손실을 허용하도록 설정할 수도 있다.

---

## 4. 시그널링

### 4.1 시그널링이란?

**시그널링(Signaling)**은 두 피어가 WebRTC 연결을 생성하기 전에 연결에 필요한 정보를 교환하는 과정이다.

주로 다음 정보를 교환한다.

* SDP Offer
* SDP Answer
* ICE Candidate
* 통화 요청 및 수락 여부
* 연결 종료 정보
* 재협상 정보

WebRTC는 시그널링을 위한 특정 프로토콜이나 서버 구현 방식을 정의하지 않는다.

따라서 개발자가 서비스 환경에 맞게 다음과 같은 기술을 사용하여 직접 구현해야 한다.

* WebSocket
* Socket.IO
* HTTP
* SSE
* 별도의 메시지 서버

> 시그널링 서버는 영상이나 음성을 직접 전송하기 위한 서버가 아니라, 두 피어가 연결을 맺기 위해 필요한 정보를 전달하는 역할을 한다.

---

### 4.2 시그널링 서버의 역할

두 브라우저는 처음부터 서로의 주소나 연결 정보를 알지 못한다.

따라서 시그널링 서버를 통해 다음과 같은 정보를 주고받는다.

```text
Peer A → Signaling Server → Peer B
Peer B → Signaling Server → Peer A
```

예를 들어 Peer A가 생성한 SDP Offer를 시그널링 서버에 전달하면, 서버가 이를 Peer B에게 전달한다.

이후 Peer B가 SDP Answer를 생성하여 같은 방식으로 Peer A에게 전달한다.

시그널링 서버는 연결 초기뿐 아니라 다음 상황에서도 다시 사용될 수 있다.

* 미디어 장치 변경
* 화면 공유 시작 또는 종료
* 네트워크 변경
* ICE Restart
* SDP 재협상
* 통화 종료 메시지 전달

따라서 연결이 완료되면 시그널링 서버가 항상 완전히 필요 없어지는 것은 아니다.

---

## 5. SDP

### 5.1 SDP란?

**SDP(Session Description Protocol)**는 피어 간에 어떤 방식으로 통신할 것인지 설명하는 형식이다.

SDP 자체가 미디어 데이터를 전송하는 프로토콜은 아니다. 통신에 사용할 미디어와 네트워크 조건을 표현하는 설명서에 가깝다.

SDP에는 다음과 같은 정보가 포함된다.

* 세션 정보
* IP 주소와 포트 정보
* 오디오 및 비디오 종류
* 지원하는 코덱
* 전송 방향
* 암호화 관련 정보
* 미디어 스트림 정보
* ICE 관련 정보

---

### 5.2 Offer와 Answer

연결을 먼저 요청하는 피어가 **Offer SDP**를 생성한다.

Offer를 받은 상대방은 자신이 지원할 수 있는 조건을 반영하여 **Answer SDP**를 생성한다.

```text
Peer A                             Peer B

Create Offer
    │
    ├──── SDP Offer ──────────────▶│
    │                              │
    │                         Create Answer
    │                              │
    │◀──── SDP Answer ─────────────┤
```

이를 통해 양쪽 피어는 다음 조건을 협상한다.

* 사용할 오디오 코덱
* 사용할 비디오 코덱
* 미디어 전송 방향
* 암호화 방식
* 미디어 스트림 정보

이 과정을 **Offer/Answer 모델**이라고 한다.

---

## 6. ICE

### 6.1 ICE란?

**ICE(Interactive Connectivity Establishment)**는 두 피어가 실제로 통신할 수 있는 최적의 네트워크 경로를 찾기 위한 프레임워크이다.

대부분의 사용자는 공유기나 회사 네트워크 내부에 있으며 NAT 또는 방화벽 뒤에 존재한다.

이 때문에 단순히 장치의 사설 IP 주소만으로는 인터넷의 다른 장치와 직접 통신하기 어렵다.

ICE는 여러 연결 후보를 수집하고 테스트하여 실제로 사용할 수 있는 경로를 선택한다.

---

### 6.2 ICE의 동작 과정

ICE는 일반적으로 다음 순서로 동작한다.

1. 연결 후보 수집
2. ICE Candidate 교환
3. 후보 조합에 대한 연결성 검사
4. 연결 가능한 후보 확인
5. 우선순위가 높은 경로 선택
6. 선택한 경로를 사용하여 통신

---

### 6.3 ICE Candidate

**ICE Candidate**는 피어가 사용할 수 있는 네트워크 연결 후보이다.

대표적으로 다음 종류가 있다.

#### Host Candidate

장치가 가지고 있는 로컬 네트워크 주소이다.

```text
192.168.0.10:50000
```

같은 네트워크에 있는 피어끼리는 Host Candidate를 통해 직접 연결될 수 있다.

#### Server Reflexive Candidate

STUN 서버를 통해 확인한 공인 IP 주소와 포트이다.

```text
203.0.113.10:62000
```

NAT 외부에서 보이는 자신의 주소를 의미한다.

#### Relay Candidate

TURN 서버가 할당한 중계 주소이다.

직접 연결이 불가능할 때 TURN 서버가 데이터를 대신 전달한다.

---

### 6.4 Trickle ICE

모든 ICE Candidate를 수집한 다음 한꺼번에 전달하면 연결 시작이 느려질 수 있다.

**Trickle ICE**는 ICE Candidate가 발견될 때마다 상대방에게 즉시 전달하는 방식이다.

이를 통해 전체 후보 수집이 끝나기 전부터 연결 검사를 시작할 수 있어 연결 시간을 줄일 수 있다.

---

## 7. NAT

### 7.1 NAT란?

**NAT(Network Address Translation)**는 사설 IP 주소와 공인 IP 주소를 변환하는 기술이다.

가정이나 회사에서는 여러 장치가 다음과 같은 사설 IP 주소를 사용한다.

```text
192.168.x.x
10.x.x.x
172.16.x.x ~ 172.31.x.x
```

사설 IP 주소는 인터넷에서 직접 접근할 수 없다.

공유기는 내부 장치가 외부 인터넷과 통신할 때 사설 IP 주소를 공인 IP 주소로 변환한다.

WebRTC에서는 NAT 환경에서도 두 피어가 연결될 수 있도록 ICE, STUN, TURN을 사용한다.

---

## 8. STUN과 TURN

STUN과 TURN은 서로 다른 네트워크 환경에 있는 피어가 연결될 수 있도록 돕는 서버이다.

다만 두 서버의 역할은 서로 다르다.

---

### 8.1 STUN

**STUN(Session Traversal Utilities for NAT)**은 클라이언트가 NAT 외부에서 보이는 자신의 공인 IP 주소와 포트를 확인하도록 도와주는 프로토콜이다.

동작 과정은 다음과 같다.

1. 클라이언트가 STUN 서버에 요청을 보낸다.
2. STUN 서버는 요청이 들어온 공인 IP 주소와 포트를 확인한다.
3. STUN 서버가 해당 주소를 클라이언트에게 반환한다.
4. 클라이언트는 이 정보를 ICE Candidate로 사용한다.

```text
Client → STUN Server
       "외부에서 보이는 내 주소가 무엇인가?"

Client ← STUN Server
       "203.0.113.10:62000"
```

STUN은 미디어 데이터를 지속적으로 중계하지 않기 때문에 비교적 가볍고 빠르다.

하지만 NAT 유형이나 방화벽 정책에 따라 STUN만으로 직접 연결할 수 없는 경우가 있다.

---

### 8.2 TURN

**TURN(Traversal Using Relays around NAT)**은 피어 간 직접 연결이 불가능할 때 서버가 데이터를 대신 중계하는 방식이다.

```text
Peer A → TURN Server → Peer B
Peer B → TURN Server → Peer A
```

TURN 서버를 사용하면 연결 성공률을 높일 수 있지만, 모든 미디어 데이터가 서버를 통과하므로 다음과 같은 단점이 있다.

* 서버 네트워크 비용 증가
* 서버 대역폭 사용량 증가
* 직접 연결보다 높은 지연 시간
* 서버 운영 비용 증가

따라서 일반적으로 다음 순서로 연결을 시도한다.

1. 로컬 주소를 이용한 직접 연결
2. STUN으로 확인한 공인 주소를 이용한 직접 연결
3. 직접 연결 실패 시 TURN 서버를 통한 중계 연결

---

### 8.3 STUN과 TURN 비교

| 구분      | STUN            | TURN          |
| ------- | --------------- | ------------- |
| 주요 역할   | 공인 IP와 포트 확인    | 미디어 및 데이터 중계  |
| 데이터 중계  | 하지 않음           | 수행함           |
| 서버 부하   | 낮음              | 높음            |
| 네트워크 비용 | 낮음              | 높음            |
| 지연 시간   | 비교적 낮음          | 상대적으로 높음      |
| 사용 시점   | 직접 연결 경로 탐색     | 직접 연결에 실패한 경우 |
| 연결 성공률  | 네트워크 환경에 따라 달라짐 | 비교적 높음        |

---

## 9. WebRTC 기본 동작 원리

서로 다른 네트워크에 있는 Peer A와 Peer B가 연결되는 과정은 다음과 같다.

### 9.1 미디어 스트림 획득

각 피어는 카메라와 마이크 접근 권한을 요청한다.

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});
```

---

### 9.2 RTCPeerConnection 생성

각 피어는 STUN 및 TURN 서버 정보가 포함된 `RTCPeerConnection`을 생성한다.

```javascript
const configuration = {
  iceServers: [
    {
      urls: "stun:stun.example.com:3478",
    },
    {
      urls: "turn:turn.example.com:3478",
      username: "username",
      credential: "password",
    },
  ],
};

const peerConnection = new RTCPeerConnection(configuration);
```

---

### 9.3 미디어 트랙 등록

자신의 오디오와 비디오 트랙을 PeerConnection에 추가한다.

```javascript
stream.getTracks().forEach((track) => {
  peerConnection.addTrack(track, stream);
});
```

---

### 9.4 SDP Offer 생성

연결을 요청하는 Peer A가 SDP Offer를 생성한다.

```javascript
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
```

Peer A는 생성한 Offer를 시그널링 서버를 통해 Peer B에게 전달한다.

---

### 9.5 SDP Answer 생성

Peer B는 전달받은 Offer를 Remote Description으로 설정한다.

```javascript
await peerConnection.setRemoteDescription(offer);
```

그 후 SDP Answer를 생성한다.

```javascript
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);
```

Peer B는 Answer를 시그널링 서버를 통해 Peer A에게 전달한다.

---

### 9.6 ICE Candidate 교환

각 피어는 ICE Candidate가 생성될 때마다 시그널링 서버를 통해 상대방에게 전달한다.

```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signalingServer.send(event.candidate);
  }
};
```

상대방으로부터 전달받은 Candidate는 PeerConnection에 추가한다.

```javascript
await peerConnection.addIceCandidate(candidate);
```

---

### 9.7 연결 경로 결정

ICE가 후보 경로를 검사하고 다음 중 하나를 선택한다.

* 같은 네트워크에서 직접 연결
* STUN으로 확인한 공인 주소를 이용한 직접 연결
* TURN 서버를 이용한 중계 연결

---

### 9.8 미디어 및 데이터 전송

연결이 완료되면 선택된 경로를 통해 오디오, 영상 또는 일반 데이터를 주고받는다.

직접 연결에 성공했다면 미디어 데이터는 시그널링 서버를 통과하지 않는다.

TURN 연결이 선택되었다면 미디어 데이터가 TURN 서버를 통해 지속적으로 중계된다.

---

## 10. WebRTC 연결 흐름 요약

```text
1. Peer A와 Peer B가 시그널링 서버에 접속

2. Peer A가 SDP Offer 생성
   Peer A → Signaling Server → Peer B

3. Peer B가 SDP Answer 생성
   Peer B → Signaling Server → Peer A

4. 각 피어가 ICE Candidate 수집

5. ICE Candidate 교환
   Peer A ↔ Signaling Server ↔ Peer B

6. ICE가 연결 가능한 경로 검사

7. 최적의 경로 선택
   - 직접 P2P 연결
   - STUN을 이용한 직접 연결
   - TURN을 이용한 중계 연결

8. 오디오, 영상 또는 데이터 통신 시작
```

---

## 11. WebRTC의 보안

WebRTC는 기본적으로 암호화된 통신을 사용한다.

주요 보안 기술은 다음과 같다.

### DTLS

**DTLS(Datagram Transport Layer Security)**는 UDP 기반 통신에서 보안을 제공한다.

WebRTC에서는 암호화 키를 안전하게 교환하거나 DataChannel 데이터를 보호하는 데 사용된다.

### SRTP

**SRTP(Secure Real-time Transport Protocol)**는 오디오와 비디오 데이터를 암호화하여 전송한다.

WebRTC에서는 일반적으로 DTLS를 통해 키를 협상하고 SRTP를 통해 미디어 데이터를 암호화한다.

```text
오디오 및 비디오
RTP → SRTP

암호화 키 협상
DTLS

일반 데이터
SCTP → DTLS → UDP
```

WebRTC에서는 암호화를 비활성화하고 평문으로 미디어를 전송하는 방식이 일반적으로 허용되지 않는다.

---

## 12. P2P Mesh 방식

### 12.1 P2P Mesh란?

소규모 화상회의에서는 각 참가자가 다른 모든 참가자와 직접 연결하는 **Mesh 구조**를 사용할 수 있다.

참가자가 N명이라면 전체 연결 수는 다음과 같다.

```text
N × (N - 1) / 2
```

예를 들어 참가자가 4명이라면 전체 연결 수는 다음과 같다.

```text
4 × 3 / 2 = 6개
```

```text
A ─ B
A ─ C
A ─ D
B ─ C
B ─ D
C ─ D
```

각 참가자는 자신의 영상을 다른 모든 참가자에게 각각 전송해야 한다.

참가자가 N명이라면 한 참가자는 일반적으로 다음 수만큼의 연결을 유지한다.

```text
N - 1개
```

---

### 12.2 P2P Mesh의 장점

* 별도의 미디어 중계 서버가 없어도 됨
* 서버의 미디어 처리 부하가 적음
* 직접 연결 시 지연 시간이 짧음
* 소수 참가자 환경에서 구조가 단순함

---

### 12.3 P2P Mesh의 단점

참가자가 증가할수록 각 클라이언트의 업로드와 다운로드 부담이 빠르게 증가한다.

예를 들어 한 사용자의 영상이 2Mbps이고 참가자가 5명이라면, 각 사용자는 자신의 영상을 나머지 4명에게 전송해야 한다.

```text
필요한 업로드 대역폭 = 2Mbps × 4 = 8Mbps
```

또한 여러 영상의 인코딩과 디코딩으로 인해 CPU 사용량도 증가한다.

따라서 Mesh 방식은 일반적으로 1:1 통신이나 매우 소규모 그룹에 적합하다.

---

## 13. SFU

### 13.1 SFU란?

**SFU(Selective Forwarding Unit)**는 참가자로부터 미디어 스트림을 전달받아 다른 참가자에게 선택적으로 전달하는 중앙 미디어 서버이다.

```text
        ┌──▶ Peer B
Peer A ─▶ SFU ─▶ Peer C
        └──▶ Peer D
```

Peer A는 자신의 영상을 SFU에 한 번만 업로드한다.

SFU는 전달받은 영상을 Peer B, Peer C, Peer D에게 각각 전달한다.

---

### 13.2 SFU의 특징

* 클라이언트는 자신의 스트림을 서버에 한 번만 업로드
* 서버는 미디어를 일반적으로 재인코딩하지 않고 전달
* 참가자별로 필요한 스트림만 선택적으로 전송 가능
* 서버가 참가자의 네트워크 상태에 맞게 품질을 선택 가능
* Mesh 방식보다 다자간 통신 확장성이 좋음
* MCU보다 서버 연산 부담이 비교적 적음
* 비교적 낮은 지연 시간을 제공

SFU에서는 여러 품질의 영상을 동시에 전송하는 **Simulcast**나 하나의 스트림에 여러 계층을 포함하는 **SVC**를 사용할 수 있다.

이를 통해 네트워크 상태가 좋은 사용자는 고화질 영상을 받고, 상태가 좋지 않은 사용자는 저화질 영상을 받을 수 있다.

---

### 13.3 SFU의 단점

* 클라이언트가 여러 참가자의 스트림을 각각 수신해야 함
* 여러 영상에 대한 디코딩 부담이 발생
* 서버의 네트워크 대역폭 사용량이 큼
* 미디어 서버 운영이 필요함

SFU는 현대적인 다자간 화상회의 서비스에서 널리 사용되는 방식이다.

---

## 14. MCU

### 14.1 MCU란?

**MCU(Multipoint Control Unit)**는 여러 참가자의 오디오와 영상 스트림을 서버에서 하나의 스트림으로 합성한 뒤 클라이언트에게 전달하는 방식이다.

```text
Peer A ─┐
Peer B ─┼─▶ MCU ─▶ 통합된 하나의 스트림
Peer C ─┘
```

예를 들어 A, B, C의 영상을 MCU가 하나의 화면으로 합성하면 모든 참가자는 합성된 하나의 영상만 수신한다.

---

### 14.2 MCU의 장점

* 클라이언트는 하나의 스트림만 수신하면 됨
* 클라이언트의 네트워크 및 디코딩 부담이 적음
* 모든 참가자에게 동일한 화면 구성을 제공할 수 있음
* 성능이 낮은 기기에서도 비교적 안정적으로 동작 가능
* 녹화나 방송 송출에 활용하기 편리함

---

### 14.3 MCU의 단점

* 서버가 디코딩, 합성, 재인코딩을 수행해야 함
* 서버 CPU 및 GPU 사용량이 매우 큼
* 미디어 처리 과정으로 지연 시간이 증가할 수 있음
* 서버 확장 비용이 큼
* 참가자별 화면 구성을 자유롭게 변경하기 어려움

MCU가 실시간성을 전혀 보장하지 못하는 것은 아니지만, 미디어 합성과 재인코딩 과정 때문에 SFU보다 지연 시간이 증가할 가능성이 크다.

---

## 15. Mesh, SFU, MCU 비교

| 구분            | Mesh P2P     | SFU               | MCU               |
| ------------- | ------------ | ----------------- | ----------------- |
| 연결 구조         | 참가자 간 직접 연결  | 서버가 스트림을 선택적으로 전달 | 서버가 스트림을 합성하여 전달  |
| 클라이언트 업로드 부담  | 매우 높음        | 비교적 낮음            | 낮음                |
| 클라이언트 다운로드 부담 | 참가자 수에 따라 증가 | 참가자 수에 따라 증가      | 낮음                |
| 클라이언트 CPU 부담  | 높음           | 중간에서 높음           | 낮음                |
| 서버 CPU 부담     | 낮음           | 비교적 낮음            | 매우 높음             |
| 서버 네트워크 부담    | 낮음           | 높음                | 중간                |
| 지연 시간         | 직접 연결 시 낮음   | 비교적 낮음            | 상대적으로 높음          |
| 확장성           | 낮음           | 높음                | 서버 성능에 크게 의존      |
| 적합한 환경        | 1:1 또는 소규모   | 일반적인 다자간 화상회의     | 방송, 녹화, 저성능 클라이언트 |

---

## 16. WebRTC에서 서버가 필요한 이유

WebRTC가 P2P 기술이라고 하더라도 실제 서비스를 구현하려면 일반적으로 여러 서버가 필요하다.

### 시그널링 서버

* SDP Offer와 Answer 전달
* ICE Candidate 전달
* 방 입장 및 퇴장 관리
* 사용자 인증
* 통화 요청 및 종료 처리

### STUN 서버

* 자신의 공인 IP와 포트 확인
* NAT 외부에서 보이는 주소 확인

### TURN 서버

* 직접 연결이 불가능할 때 미디어와 데이터 중계

### SFU 또는 MCU 서버

* 다자간 미디어 통신 처리
* 참가자별 영상 전달 또는 영상 합성

### 애플리케이션 서버

* 회원 관리
* 채팅방 관리
* 권한 관리
* 통화 기록 관리
* 녹화 파일 관리

따라서 실제 WebRTC 서비스는 다음과 같은 형태로 구성될 수 있다.

```text
Client
  │
  ├── Application Server
  ├── Signaling Server
  ├── STUN/TURN Server
  └── SFU or MCU Server
```

---

## 17. WebRTC에서 UDP를 주로 사용하는 이유

실시간 음성이나 영상에서는 일부 패킷이 손실되더라도 최신 데이터를 빠르게 전달하는 것이 중요하다.

TCP는 패킷이 손실되면 재전송하고 순서를 보장한다. 그러나 재전송을 기다리는 동안 지연이 발생할 수 있다.

UDP는 다음과 같은 특징이 있다.

* 재전송을 기본적으로 수행하지 않음
* 데이터 순서를 반드시 보장하지 않음
* 지연 시간이 비교적 낮음
* 실시간 음성 및 영상 전송에 적합함

따라서 WebRTC는 일반적으로 UDP를 우선적으로 사용한다.

다만 UDP 연결이 차단된 환경에서는 TURN 서버를 통해 TCP 또는 TLS 기반 연결을 사용할 수도 있다.

---

## 18. WebRTC 품질 제어

WebRTC는 네트워크 상태에 따라 실시간으로 전송 품질을 조절한다.

다음과 같은 정보를 바탕으로 품질을 조정할 수 있다.

* 사용 가능한 대역폭
* 패킷 손실률
* 왕복 지연 시간
* 지터
* 프레임 드롭
* CPU 사용량
* 인코딩 속도

네트워크 상태가 나빠지면 다음과 같은 방식으로 대응할 수 있다.

* 비디오 해상도 감소
* 프레임 수 감소
* 비트레이트 감소
* 특정 영상 스트림 일시 중지
* 오디오 우선 전송
* 낮은 품질의 Simulcast 계층 선택

---

## 19. WebRTC 주요 프로토콜 정리

| 기술        | 역할                  |
| --------- | ------------------- |
| SDP       | 미디어 및 연결 조건을 설명     |
| ICE       | 최적의 연결 경로 탐색        |
| STUN      | 공인 IP와 포트 확인        |
| TURN      | 직접 연결 실패 시 데이터 중계   |
| RTP       | 실시간 오디오 및 영상 전송     |
| RTCP      | RTP 전송 품질과 상태 정보 전달 |
| SRTP      | 오디오 및 영상 암호화        |
| DTLS      | 암호화 키 협상 및 데이터 보호   |
| SCTP      | DataChannel의 데이터 전송 |
| WebSocket | 시그널링 구현에 자주 사용      |