package com.roma.qurie.report.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

/**
 * 실제 라이브러리·폰트 리소스를 태우는 통합 성격의 단위 테스트.
 * 폰트 파일 누락이나 라이브러리 버전 교체로 인한 회귀를 빌드에서 잡는 것이 목적이다.
 */
class ReportPdfRendererTest {

	private final ReportPdfRenderer renderer = new ReportPdfRenderer();

	@Test
	void 한글이_담긴_XHTML_을_PDF_로_변환한다() throws Exception {
		String xhtml = "<html><head><style>body { font-family: 'NanumGothic'; }</style></head>"
				+ "<body><h1>학습 최종 리포트</h1><p>한글 임베드 확인</p></body></html>";

		byte[] pdf = renderer.render(xhtml);

		assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
		// 한글 폰트가 임베드되지 않으면 글리프가 빠져 텍스트도 추출되지 않는다.
		try (PDDocument document = Loader.loadPDF(pdf)) {
			String text = new PDFTextStripper().getText(document);
			assertThat(text).contains("학습 최종 리포트");
			assertThat(text).contains("한글 임베드 확인");
		}
	}
}
