package com.campusbazaar.dto;

import java.time.Instant;

public record WishlistEntryDto(
        Long id,
        Instant addedAt,
        boolean available,
        ListingDto listing
) {}
