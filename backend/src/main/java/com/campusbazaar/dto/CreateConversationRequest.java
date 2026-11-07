package com.campusbazaar.dto;

import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(@NotNull Long listingId) {}
