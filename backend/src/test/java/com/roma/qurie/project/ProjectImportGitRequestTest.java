package com.roma.qurie.project;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.roma.qurie.project.dto.ProjectImportGitRequest;

class ProjectImportGitRequestTest {

	@Test
	void toStringMasksPat() {
		ProjectImportGitRequest request = new ProjectImportGitRequest(
				1L, "https://github.com/foo/private.git", "main", null, "glpat-secret");

		assertThat(request.toString()).doesNotContain("glpat-secret").contains("****");
	}

	@Test
	void toStringKeepsNullPatVisibleAsNull() {
		ProjectImportGitRequest request = new ProjectImportGitRequest(
				1L, "https://github.com/foo/bar.git", null, null, null);

		assertThat(request.toString()).contains("pat=null");
	}
}
