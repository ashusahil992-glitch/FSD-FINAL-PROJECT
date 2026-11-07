package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.CampusPostDto;
import com.campusbazaar.dto.CreateCampusPostRequest;
import com.campusbazaar.service.CampusBoardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/campus-board")
public class CampusBoardController {

    private final CampusBoardService campusBoardService;

    public CampusBoardController(CampusBoardService campusBoardService) {
        this.campusBoardService = campusBoardService;
    }

    @GetMapping
    public ApiResponse<List<CampusPostDto>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(campusBoardService.list(jwt.getSubject()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CampusPostDto>> create(
            @Valid @RequestBody CreateCampusPostRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(campusBoardService.create(request, jwt.getSubject())));
    }

    @PatchMapping("/{id}/resolve")
    public ApiResponse<CampusPostDto> resolve(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(campusBoardService.resolve(id, jwt.getSubject()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        campusBoardService.delete(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
