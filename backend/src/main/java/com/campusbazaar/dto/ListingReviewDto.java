package com.campusbazaar.dto;

import java.time.Instant;

public record ListingReviewDto(
        Long id,
        int rating,
        String comment,
        String reviewerName,
        Instant createdAt
) {}
