package com.campusbazaar.dto;

import java.time.Instant;

public record CampusPostDto(
        Long id,
        Long authorId,
        String title,
        String description,
        String location,
        String type,
        String status,
        String authorName,
        boolean authorVerified,
        String universityName,
        Instant createdAt
) {}
