package com.campusbazaar.dto;

import java.time.Instant;

public record ChatMessageDto(Long id, Long conversationId, Long senderId, String senderName, String content, Instant createdAt) {}
