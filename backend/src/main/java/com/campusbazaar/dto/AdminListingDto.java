package com.campusbazaar.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminListingDto(
        Long id,
        String title,
        BigDecimal price,
        String status,
        String category,
        String sellerName,
        String sellerEmail,
        boolean demo,
        Instant createdAt
) {}
