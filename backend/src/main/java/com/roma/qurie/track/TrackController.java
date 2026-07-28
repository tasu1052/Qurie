package com.roma.qurie.track;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.dto.TrackCreateRequest;
import com.roma.qurie.track.dto.TrackResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    /** 트랙 생성 (MASTER) */
    @PostMapping
    public ResponseEntity<TrackResponse> create(
            @AuthenticationPrincipal AuthUser authUser, @Valid @RequestBody TrackCreateRequest request) {
        TrackResponse response = trackService.create(authUser, request);
        return ResponseEntity.created(URI.create("/api/tracks/" + response.id())).body(response);
    }
}
