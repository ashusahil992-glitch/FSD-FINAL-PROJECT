package com.campusbazaar.dto;

import java.time.Instant;

public record AdminUserDto(
        Long id,
        String fullName,
        String email,
        String maskedStudentId,
        String university,
        String role,
        String status,
        boolean emailVerified,
        boolean studentVerified,
        Instant createdAt
) {}
