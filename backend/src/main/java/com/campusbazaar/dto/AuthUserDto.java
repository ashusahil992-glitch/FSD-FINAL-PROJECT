package com.campusbazaar.dto;

public record AuthUserDto(
        Long id,
        String fullName,
        String email,
        String maskedStudentId,
        String university,
        Long universityId,
        String role,
        String status,
        boolean emailVerified,
        boolean studentVerified
) {}
