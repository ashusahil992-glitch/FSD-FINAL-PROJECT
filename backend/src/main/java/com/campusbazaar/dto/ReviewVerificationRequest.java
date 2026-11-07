package com.campusbazaar.dto;

import com.campusbazaar.entity.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewVerificationRequest(
        @NotNull VerificationStatus status,
        @Size(max = 1000) String rejectionReason
) {}
