package com.campusbazaar.dto;

import java.util.List;

public record ListingSearchPageDto(
        List<ListingDto> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {}
