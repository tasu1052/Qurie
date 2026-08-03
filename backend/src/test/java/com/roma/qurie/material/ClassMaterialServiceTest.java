package com.roma.qurie.material;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.material.dto.ClassMaterialResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ClassMaterialServiceTest {

	private static final Long CLASS_ID = 1L;
	private static final Long MATERIAL_ID = 10L;

	@Mock
	private ClassMaterialRepository materialRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private ClassMaterialService materialService;

	@Test
	void uploadStoresFileForClassManager() {
		givenClassMember(manager());
		given(materialRepository.save(any(ClassMaterial.class))).willAnswer(invocation -> {
			ClassMaterial material = invocation.getArgument(0);
			ReflectionTestUtils.setField(material, "id", MATERIAL_ID);
			return material;
		});

		ClassMaterialResponse response = materialService.upload(
				CLASS_ID, file("chapter1.pdf", "application/pdf", "pdf-bytes"), manager());

		assertThat(response.id()).isEqualTo(MATERIAL_ID);
		assertThat(response.fileName()).isEqualTo("chapter1.pdf");
		assertThat(response.contentType()).isEqualTo("application/pdf");
		assertThat(response.byteSize()).isEqualTo("pdf-bytes".length());
		assertThat(response.uploaderName()).isEqualTo(manager().name());
	}

	@Test
	void uploadRejectsStudent() {
		givenClassMember(student());

		assertThatThrownBy(() -> materialService.upload(
				CLASS_ID, file("chapter1.pdf", "application/pdf", "x"), student()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassMaterialServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(materialRepository, never()).save(any(ClassMaterial.class));
	}

	@Test
	void uploadRejectsManagerOutsideClass() {
		given(classRepository.existsById(CLASS_ID)).willReturn(true);
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, manager().id())).willReturn(false);

		assertThatThrownBy(() -> materialService.upload(
				CLASS_ID, file("chapter1.pdf", "application/pdf", "x"), manager()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassMaterialServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void uploadRejectsEmptyFile() {
		givenClassMember(manager());

		assertThatThrownBy(() -> materialService.upload(
				CLASS_ID, file("empty.pdf", "application/pdf", ""), manager()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassMaterialServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void getMaterialsRequiresClassMembership() {
		given(classRepository.existsById(CLASS_ID)).willReturn(true);
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, student().id())).willReturn(false);

		assertThatThrownBy(() -> materialService.getMaterials(CLASS_ID, student()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassMaterialServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void downloadRejectsMaterialOfAnotherClass() {
		givenClassMember(student());
		ClassMaterial other = new ClassMaterial(99L, "a.pdf", "application/pdf", "x".getBytes(StandardCharsets.UTF_8), 2L);
		given(materialRepository.findById(MATERIAL_ID)).willReturn(Optional.of(other));

		assertThatThrownBy(() -> materialService.download(CLASS_ID, MATERIAL_ID, student()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassMaterialServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void downloadReturnsStoredBytes() {
		givenClassMember(student());
		ClassMaterial material = new ClassMaterial(
				CLASS_ID, "a.pdf", "application/pdf", "pdf-bytes".getBytes(StandardCharsets.UTF_8), 2L);
		given(materialRepository.findById(MATERIAL_ID)).willReturn(Optional.of(material));

		ClassMaterialService.Download download = materialService.download(CLASS_ID, MATERIAL_ID, student());

		assertThat(download.fileName()).isEqualTo("a.pdf");
		assertThat(new String(download.data(), StandardCharsets.UTF_8)).isEqualTo("pdf-bytes");
	}

	@Test
	void deleteRejectsStudent() {
		givenClassMember(student());

		assertThatThrownBy(() -> materialService.delete(CLASS_ID, MATERIAL_ID, student()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassMaterialServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(materialRepository, never()).delete(any(ClassMaterial.class));
	}

	@Test
	void sanitizeFileNameStripsPathSegments() {
		assertThat(ClassMaterialService.sanitizeFileName("week1\\슬라이드.pdf")).isEqualTo("슬라이드.pdf");
		assertThat(ClassMaterialService.sanitizeFileName("folder/notes.txt")).isEqualTo("notes.txt");
		assertThatThrownBy(() -> ClassMaterialService.sanitizeFileName("folder/"))
				.isInstanceOf(ResponseStatusException.class);
	}

	@Test
	void sanitizeContentTypeFallsBackToOctetStream() {
		assertThat(ClassMaterialService.sanitizeContentType(null)).isEqualTo("application/octet-stream");
		assertThat(ClassMaterialService.sanitizeContentType("not a type")).isEqualTo("application/octet-stream");
		assertThat(ClassMaterialService.sanitizeContentType("application/pdf")).isEqualTo("application/pdf");
	}

	private void givenClassMember(AuthUser user) {
		given(classRepository.existsById(CLASS_ID)).willReturn(true);
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, user.id())).willReturn(true);
	}

	private AuthUser manager() {
		return new AuthUser(2L, "MANAGER", 1L, "manager@test.com", "강사", CLASS_ID);
	}

	private AuthUser student() {
		return new AuthUser(5L, "STUDENT", 1L, "student@test.com", "학생", CLASS_ID);
	}

	private MockMultipartFile file(String name, String contentType, String content) {
		return new MockMultipartFile("file", name, contentType, content.getBytes(StandardCharsets.UTF_8));
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException)throwable).getStatusCode();
	}
}
