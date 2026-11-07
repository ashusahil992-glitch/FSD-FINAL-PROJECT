package com.campusbazaar.dto;

import jakarta.validation.constraints.NotNull;

public record ListingModerationRequest(@NotNull ModerationStatus status) {
    public enum ModerationStatus { AVAILABLE, REMOVED }
}
