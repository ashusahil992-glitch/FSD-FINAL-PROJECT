package com.campusbazaar.dto;

import java.time.Instant;

public record NotificationDto(
        Long id,
        String title,
        String message,
        Long conversationId,
        Long listingId,
        String listingTitle,
        Instant createdAt,
        Instant readAt,
        String type,
        String targetUrl,
        Long relatedEntityId
) {}
