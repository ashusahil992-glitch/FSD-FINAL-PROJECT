package com.campusbazaar.dto;

import java.time.Instant;

public record AdminReportDto(
        Long id,
        Long listingId,
        String listingTitle,
        String reporterName,
        String reporterEmail,
        String reason,
        String status,
        Instant createdAt
) {}
