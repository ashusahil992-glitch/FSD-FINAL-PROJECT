package com.campusbazaar.dto;

import java.time.Instant;
import java.time.LocalDate;

public record LocalDealDto(
        Long id,
        String businessName,
        String title,
        String offer,
        String description,
        String couponCode,
        String category,
        String location,
        String redemptionUrl,
        LocalDate validUntil,
        String submittedBy,
        Instant createdAt
) {}
