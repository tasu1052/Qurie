package com.roma.qurie.report.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

/**
 * XHTML 문자열을 PDF 바이트로 변환한다.
 *
 * 뷰어 환경과 무관하게 글자가 보이려면 한글 폰트를 PDF 에 직접 임베드해야 한다 —
 * 임베드하지 않으면 한글이 전부 빈 사각형으로 깨진다. 나눔고딕(OFL)을 classpath 리소스로 담아 쓴다.
 */
@Component
public class ReportPdfRenderer {

	/** 템플릿 CSS 의 font-family 와 일치해야 폰트가 적용된다. */
	static final String FONT_FAMILY = "NanumGothic";
	private static final String FONT_RESOURCE = "/fonts/NanumGothic-Regular.ttf";

	public byte[] render(String xhtml) {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		try {
			PdfRendererBuilder builder = new PdfRendererBuilder();
			builder.useFastMode();
			builder.useFont(this::openFontStream, FONT_FAMILY);
			builder.withHtmlContent(xhtml, null);
			builder.toStream(out);
			builder.run();
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "리포트 PDF 생성에 실패했습니다.", e);
		}
		return out.toByteArray();
	}

	private InputStream openFontStream() {
		InputStream stream = getClass().getResourceAsStream(FONT_RESOURCE);
		if (stream == null) {
			throw new IllegalStateException("한글 폰트 리소스가 없습니다: " + FONT_RESOURCE);
		}
		return stream;
	}
}
