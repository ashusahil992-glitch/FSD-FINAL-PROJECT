package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.CreateListingReviewRequest;
import com.campusbazaar.dto.ListingReviewSummaryDto;
import com.campusbazaar.service.ListingReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/listings/{listingId}/reviews")
public class ListingReviewController {

    private final ListingReviewService reviewService;

    public ListingReviewController(ListingReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ApiResponse<ListingReviewSummaryDto> list(
            @PathVariable Long listingId,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(reviewService.getReviews(listingId, jwt == null ? null : jwt.getSubject()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ListingReviewSummaryDto> create(
            @PathVariable Long listingId,
            @Valid @RequestBody CreateListingReviewRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("Review saved successfully.",
                reviewService.createReview(listingId, request, jwt.getSubject()));
    }
}
