package com.campusbazaar.dto;

import java.time.Instant;

public record AdminVerificationDto(
        Long id,
        Long studentId,
        String studentName,
        String university,
        String maskedStudentId,
        String status,
        String rejectionReason,
        Instant submittedAt,
        Instant reviewedAt
) {}
