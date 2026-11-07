package com.campusbazaar.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ListingDto(
        Long id,
        String title,
        String description,
        BigDecimal price,
        String condition,
        String listingType,
        String status,
        String imageUrl,
        CategorySummary category,
        SellerSummary seller,
        boolean demo,
        boolean popular,
        boolean studentDeal,
        boolean hostelClearance,
        boolean studentDiscountAvailable,
        boolean studentDiscountEligible,
        BigDecimal studentDiscountedPrice,
        BigDecimal discountPercentage,
        BigDecimal amountSaved,
        Instant createdAt
) {
    public record CategorySummary(String name, String slug, String icon) {}
    public record SellerSummary(Long id, String name, boolean verified) {}
}
