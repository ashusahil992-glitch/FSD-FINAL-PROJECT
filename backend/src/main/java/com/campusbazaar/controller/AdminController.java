package com.campusbazaar.controller;

import com.campusbazaar.dto.AdminDashboardDto;
import com.campusbazaar.dto.AdminListingDto;
import com.campusbazaar.dto.AdminReportDto;
import com.campusbazaar.dto.AdminUserDto;
import com.campusbazaar.dto.AdminVerificationDto;
import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.ListingModerationRequest;
import com.campusbazaar.dto.ReportReviewRequest;
import com.campusbazaar.dto.ReviewVerificationRequest;
import com.campusbazaar.dto.StudentVerificationHistoryDto;
import com.campusbazaar.service.AdminService;
import com.campusbazaar.service.StudentVerificationService;
import com.campusbazaar.service.StudentVerificationService.PrivateDocument;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final StudentVerificationService verificationService;

    public AdminController(AdminService adminService, StudentVerificationService verificationService) {
        this.adminService = adminService;
        this.verificationService = verificationService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardDto> dashboard() {
        return ApiResponse.ok(adminService.dashboard());
    }

    @GetMapping("/users")
    public ApiResponse<List<AdminUserDto>> users() {
        return ApiResponse.ok(adminService.users());
    }

    @GetMapping("/verifications")
    public ApiResponse<List<AdminVerificationDto>> verifications(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String q) {
        return ApiResponse.ok(verificationService.adminList(status, q));
    }

    @GetMapping("/verifications/{studentId}/history")
    public ApiResponse<List<StudentVerificationHistoryDto>> verificationHistory(@PathVariable Long studentId) {
        return ApiResponse.ok(verificationService.adminHistory(studentId));
    }

    @GetMapping("/verifications/{requestId}/document")
    public ResponseEntity<byte[]> verificationDocument(@PathVariable Long requestId) {
        PrivateDocument document = verificationService.getAdminDocument(requestId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(document.contentType()));
        headers.setContentDisposition(ContentDisposition.inline().filename("verification-document").build());
        headers.setCacheControl(CacheControl.noStore());
        headers.set("X-Content-Type-Options", "nosniff");
        return ResponseEntity.ok().headers(headers).body(document.content());
    }

    @PatchMapping("/verifications/{requestId}")
    public ApiResponse<AdminVerificationDto> reviewVerification(
            @PathVariable Long requestId,
            @Valid @org.springframework.web.bind.annotation.RequestBody ReviewVerificationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(verificationService.review(requestId, request, jwt.getSubject()));
    }

    @PatchMapping("/users/{id}/suspend")
    public ApiResponse<AdminUserDto> suspendUser(@PathVariable Long id) {
        return ApiResponse.ok(adminService.suspendUser(id));
    }

    @PatchMapping("/users/{id}/reinstate")
    public ApiResponse<AdminUserDto> reinstateUser(@PathVariable Long id) {
        return ApiResponse.ok(adminService.reinstateUser(id));
    }

    @GetMapping("/listings")
    public ApiResponse<List<AdminListingDto>> listings() {
        return ApiResponse.ok(adminService.listings());
    }

    @PatchMapping("/listings/{id}/moderation")
    public ApiResponse<AdminListingDto> moderateListing(
            @PathVariable Long id,
            @Valid @RequestBody ListingModerationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(adminService.moderateListing(id, request, jwt.getSubject()));
    }

    @GetMapping("/reports")
    public ApiResponse<List<AdminReportDto>> reports() {
        return ApiResponse.ok(adminService.reports());
    }

    @PatchMapping("/reports/{id}")
    public ApiResponse<AdminReportDto> reviewReport(
            @PathVariable Long id,
            @Valid @RequestBody ReportReviewRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(adminService.reviewReport(id, request, jwt.getSubject()));
    }
}
