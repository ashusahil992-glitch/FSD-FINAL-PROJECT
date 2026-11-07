package com.campusbazaar.dto;

import java.util.List;

public record StudentVerificationProfileDto(
        String status,
        String maskedStudentId,
        String university,
        String rejectionReason,
        boolean canSubmitDocument,
        List<StudentVerificationHistoryDto> history
) {}
