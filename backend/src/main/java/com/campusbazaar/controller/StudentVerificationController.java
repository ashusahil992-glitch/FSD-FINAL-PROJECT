package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.StudentVerificationProfileDto;
import com.campusbazaar.service.StudentVerificationService;
import com.campusbazaar.service.StudentVerificationService.PrivateDocument;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
@RequestMapping("/api/verifications")
public class StudentVerificationController {

    private final StudentVerificationService verificationService;

    public StudentVerificationController(StudentVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @GetMapping("/me")
    public ApiResponse<StudentVerificationProfileDto> profile(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(verificationService.profile(jwt.getSubject()));
    }

    @PostMapping(value = "/me/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<StudentVerificationProfileDto> submitDocument(
            @RequestPart("document") @NotNull MultipartFile document,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("Verification document submitted for review.",
                verificationService.submitDocument(jwt.getSubject(), document));
    }

    @GetMapping("/me/document")
    public ResponseEntity<byte[]> ownDocument(@AuthenticationPrincipal Jwt jwt) {
        return documentResponse(verificationService.getOwnDocument(jwt.getSubject()));
    }

    private ResponseEntity<byte[]> documentResponse(PrivateDocument document) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(document.contentType()));
        headers.setContentDisposition(ContentDisposition.inline().filename("verification-document").build());
        headers.setCacheControl(CacheControl.noStore());
        headers.set("X-Content-Type-Options", "nosniff");
        return ResponseEntity.ok().headers(headers).body(document.content());
    }
}
