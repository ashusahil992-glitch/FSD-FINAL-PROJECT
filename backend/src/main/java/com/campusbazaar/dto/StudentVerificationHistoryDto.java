package com.campusbazaar.dto;

import java.time.Instant;

public record StudentVerificationHistoryDto(
        Long id,
        String status,
        String rejectionReason,
        Instant submittedAt,
        Instant reviewedAt
) {}
