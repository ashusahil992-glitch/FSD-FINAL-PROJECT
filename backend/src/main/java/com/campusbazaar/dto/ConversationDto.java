package com.campusbazaar.dto;

import java.time.Instant;

public record ConversationDto(
        Long id,
        Long listingId,
        String listingTitle,
        Long otherParticipantId,
        String otherParticipantName,
        String lastMessage,
        Instant updatedAt
) {}
