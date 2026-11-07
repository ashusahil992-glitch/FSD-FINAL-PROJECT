package com.campusbazaar.dto;

import java.util.List;

public record ListingReviewSummaryDto(
        List<ListingReviewDto> reviews,
        Double listingAverageRating,
        long listingReviewCount,
        Double sellerAverageRating,
        long sellerReviewCount,
        boolean hasReviewed
) {}
