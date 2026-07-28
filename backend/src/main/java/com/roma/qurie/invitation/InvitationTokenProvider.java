package com.roma.qurie.invitation;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

/**
 * 초대 토큰 원문 생성 및 해시. RefreshTokenProvider 와 같은 방식이지만 유효기간 정책이 달라
 * (초대는 며칠, 리프레시 토큰은 몇 주) 별도 컴포넌트로 둔다.
 * 원문은 메일 링크로만 나가고 DB 에는 해시만 저장한다.
 */
@Component
public class InvitationTokenProvider {

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	public String generateToken() {
		byte[] bytes = new byte[32];
		SECURE_RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	public String hash(String rawToken) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hashBytes);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm not available", e);
		}
	}
}
