package com.roma.qurie.invitation;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * 초대 일괄 발송용 파일에서 이메일을 읽는다. xlsx/xls 는 POI 로, csv 는 직접 파싱한다.
 *
 * 사람이 만든 파일이라 양식을 강제하지 않는다 — 헤더가 있어도 되고 없어도 되며, 이메일이 몇 번째 열이어도 된다.
 * 각 행에서 '@' 가 들어간 첫 셀을 이메일로 본다. 양식을 강제하면 "왜 안 되는지" 문의가 기능보다 많아진다.
 */
@Component
public class InvitationFileReader {

	/** 메일 발송이 행마다 SMTP 왕복이라 한 번에 처리할 수 있는 양에 상한을 둔다. */
	public static final int MAX_ROWS = 200;

	/** Excel 이 한국어 Windows 에서 저장한 CSV 는 UTF-8 이 아닐 수 있어 이 순서로 시도한다. */
	private static final Charset[] CSV_CHARSETS = {StandardCharsets.UTF_8, Charset.forName("MS949")};
	private static final char BOM = '﻿';

	public List<EmailRow> read(String fileName, byte[] content) {
		if (content == null || content.length == 0) {
			throw badRequest("파일이 비어 있습니다.");
		}
		List<EmailRow> rows = isSpreadsheet(fileName) ? readSpreadsheet(content) : readCsv(content);
		if (rows.isEmpty()) {
			throw badRequest("파일에서 이메일을 찾지 못했습니다. 이메일이 담긴 열이 있는지 확인하세요.");
		}
		if (rows.size() > MAX_ROWS) {
			throw badRequest("한 번에 최대 " + MAX_ROWS + "건까지 초대할 수 있습니다. 파일을 나눠서 올려주세요.");
		}
		return rows;
	}

	private boolean isSpreadsheet(String fileName) {
		if (fileName == null) {
			return false;
		}
		String lowered = fileName.toLowerCase();
		return lowered.endsWith(".xlsx") || lowered.endsWith(".xls") || lowered.endsWith(".xlsm");
	}

	private List<EmailRow> readSpreadsheet(byte[] content) {
		List<EmailRow> rows = new ArrayList<>();
		DataFormatter formatter = new DataFormatter();
		try (InputStream input = new ByteArrayInputStream(content);
				Workbook workbook = WorkbookFactory.create(input)) {
			Sheet sheet = workbook.getSheetAt(0);
			for (Row row : sheet) {
				findEmail(row, formatter)
						.ifPresent(email -> rows.add(new EmailRow(row.getRowNum() + 1, email)));
			}
		} catch (IOException | RuntimeException e) {
			throw badRequest("엑셀 파일을 읽지 못했습니다. 손상된 파일인지 확인하세요.");
		}
		return rows;
	}

	private java.util.Optional<String> findEmail(Row row, DataFormatter formatter) {
		for (Cell cell : row) {
			String value = formatter.formatCellValue(cell).trim();
			if (value.contains("@")) {
				return java.util.Optional.of(value);
			}
		}
		return java.util.Optional.empty();
	}

	private List<EmailRow> readCsv(byte[] content) {
		String text = decode(content);
		List<EmailRow> rows = new ArrayList<>();
		String[] lines = text.split("\r?\n");
		for (int i = 0; i < lines.length; i++) {
			String line = lines[i];
			if (i == 0 && !line.isEmpty() && line.charAt(0) == BOM) {
				line = line.substring(1);
			}
			for (String field : splitCsvLine(line)) {
				if (field.contains("@")) {
					rows.add(new EmailRow(i + 1, field));
					break;
				}
			}
		}
		return rows;
	}

	/** 인용부호 안의 쉼표를 필드 구분자로 착각하지 않도록 직접 나눈다("성, 이름" 같은 열이 섞여 있어도 안전). */
	private List<String> splitCsvLine(String line) {
		List<String> fields = new ArrayList<>();
		StringBuilder current = new StringBuilder();
		boolean quoted = false;
		for (int i = 0; i < line.length(); i++) {
			char ch = line.charAt(i);
			if (ch == '"') {
				boolean escapedQuote = quoted && i + 1 < line.length() && line.charAt(i + 1) == '"';
				if (escapedQuote) {
					current.append('"');
					i++;
				} else {
					quoted = !quoted;
				}
				continue;
			}
			if (ch == ',' && !quoted) {
				fields.add(current.toString().trim());
				current.setLength(0);
				continue;
			}
			current.append(ch);
		}
		fields.add(current.toString().trim());
		return fields;
	}

	private String decode(byte[] content) {
		for (Charset charset : CSV_CHARSETS) {
			try {
				CharBuffer decoded = charset.newDecoder()
						.onMalformedInput(CodingErrorAction.REPORT)
						.onUnmappableCharacter(CodingErrorAction.REPORT)
						.decode(ByteBuffer.wrap(content));
				return decoded.toString();
			} catch (CharacterCodingException ignored) {
				// 다음 인코딩으로 넘어간다.
			}
		}
		throw badRequest("CSV 인코딩을 인식하지 못했습니다. UTF-8 로 저장한 뒤 다시 올려주세요.");
	}

	private ResponseStatusException badRequest(String message) {
		return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
	}

	/** 파일에서 읽은 한 줄. rowNumber 는 사용자가 파일에서 찾을 수 있도록 1부터 센다. */
	public record EmailRow(int rowNumber, String email) {
	}
}
