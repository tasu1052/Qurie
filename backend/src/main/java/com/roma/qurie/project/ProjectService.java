package com.roma.qurie.project;

import com.roma.qurie.project.dto.ProjectCreateRequest;
import com.roma.qurie.project.dto.ProjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    /* 프로젝트를 생성하는 함수 */
    @Transactional
    public ProjectResponse create(ProjectCreateRequest request) {
        Project project = new Project(request.sessionId(), request.path(), request.importedBy());
        return ProjectResponse.from(projectRepository.save(project));
    }
}
