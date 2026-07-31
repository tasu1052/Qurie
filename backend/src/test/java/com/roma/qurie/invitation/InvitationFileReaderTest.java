package com.roma.qurie.invitation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class InvitationFileReaderTest {

	private final InvitationFileReader reader = new InvitationFileReader();

	@Test
	void readsEmailsFromCsvSkippingHeader() {
		String csv = """
				이름,이메일,비고
				김학생,student1@qurie.com,1반
				이학생,student2@qurie.com,
				""";

		List<InvitationFileReader.EmailRow> rows = reader.read("members.csv", csv.getBytes(StandardCharsets.UTF_8));

		assertThat(rows).extracting(InvitationFileReader.EmailRow::email)
				.containsExactly("student1@qurie.com", "student2@qurie.com");
		assertThat(rows).extracting(InvitationFileReader.EmailRow::rowNumber).containsExactly(2, 3);
	}

	/** 열 순서·헤더 유무를 강제하지 않는다 — 이메일만 찾아낸다. */
	@Test
	void readsEmailFromAnyColumnWithoutHeader() {
		String csv = "student@qurie.com,김학생\n";

		List<InvitationFileReader.EmailRow> rows = reader.read("x.csv", csv.getBytes(StandardCharsets.UTF_8));

		assertThat(rows).singleElement()
				.extracting(InvitationFileReader.EmailRow::email)
				.isEqualTo("student@qurie.com");
	}

	@Test
	void ignoresCommaInsideQuotedField() {
		String csv = "\"김, 학생\",student@qurie.com\n";

		List<InvitationFileReader.EmailRow> rows = reader.read("x.csv", csv.getBytes(StandardCharsets.UTF_8));

		assertThat(rows).singleElement()
				.extracting(InvitationFileReader.EmailRow::email)
				.isEqualTo("student@qurie.com");
	}

	/** Excel 이 저장한 CSV 는 BOM 이 붙는다. 첫 셀에 BOM 이 남으면 이메일 검증에서 걸린다. */
	@Test
	void stripsUtf8Bom() {
		byte[] withBom = ("﻿student@qurie.com\n").getBytes(StandardCharsets.UTF_8);

		List<InvitationFileReader.EmailRow> rows = reader.read("x.csv", withBom);

		assertThat(rows).singleElement()
				.extracting(InvitationFileReader.EmailRow::email)
				.isEqualTo("student@qurie.com");
	}

	/** 한국어 Windows Excel 이 저장한 CSV 는 UTF-8 이 아니다. 디코딩에서 터지면 업로드 전체가 실패한다. */
	@Test
	void fallsBackToMs949WhenNotUtf8() {
		byte[] ms949 = "김학생,student@qurie.com\n".getBytes(Charset.forName("MS949"));

		List<InvitationFileReader.EmailRow> rows = reader.read("x.csv", ms949);

		assertThat(rows).singleElement()
				.extracting(InvitationFileReader.EmailRow::email)
				.isEqualTo("student@qurie.com");
	}

	@Test
	void readsEmailsFromXlsx() throws IOException {
		byte[] xlsx = xlsx(List.of(
				List.of("이름", "이메일"),
				List.of("김학생", "student1@qurie.com"),
				List.of("이학생", "student2@qurie.com")));

		List<InvitationFileReader.EmailRow> rows = reader.read("members.xlsx", xlsx);

		assertThat(rows).extracting(InvitationFileReader.EmailRow::email)
				.containsExactly("student1@qurie.com", "student2@qurie.com");
	}

	@Test
	void rejectsEmptyFile() {
		assertThatThrownBy(() -> reader.read("x.csv", new byte[0]))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void rejectsFileWithoutAnyEmail() {
		String csv = "이름,반\n김학생,1반\n";

		assertThatThrownBy(() -> reader.read("x.csv", csv.getBytes(StandardCharsets.UTF_8)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void rejectsFileOverRowLimit() {
		StringBuilder csv = new StringBuilder();
		for (int i = 0; i <= InvitationFileReader.MAX_ROWS; i++) {
			csv.append("student").append(i).append("@qurie.com\n");
		}

		assertThatThrownBy(() -> reader.read("x.csv", csv.toString().getBytes(StandardCharsets.UTF_8)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void rejectsCorruptedSpreadsheet() {
		assertThatThrownBy(() -> reader.read("x.xlsx", "이건 엑셀이 아니다".getBytes(StandardCharsets.UTF_8)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	private byte[] xlsx(List<List<String>> rows) throws IOException {
		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("명단");
			for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
				Row row = sheet.createRow(rowIndex);
				List<String> values = rows.get(rowIndex);
				for (int cellIndex = 0; cellIndex < values.size(); cellIndex++) {
					row.createCell(cellIndex).setCellValue(values.get(cellIndex));
				}
			}
			workbook.write(out);
			return out.toByteArray();
		}
	}
}
