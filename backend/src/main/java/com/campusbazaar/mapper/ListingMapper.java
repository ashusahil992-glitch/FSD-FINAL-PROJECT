package com.campusbazaar.mapper;

import com.campusbazaar.dto.ListingDto;
import com.campusbazaar.entity.Listing;

public final class ListingMapper {
    private ListingMapper() {}

    public static ListingDto toDto(Listing listing) {
        return toDto(listing, false);
    }

    public static ListingDto toDto(Listing listing, boolean discountEligible) {
        boolean discountAvailable = listing.isStudentDiscountEnabled();
        return new ListingDto(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getCondition().name(),
                listing.getListingType().name(),
                listing.getStatus().name(),
                listing.getImageUrl(),
                new ListingDto.CategorySummary(
                        listing.getCategory().getName(),
                        listing.getCategory().getSlug(),
                        listing.getCategory().getIcon()),
                new ListingDto.SellerSummary(
                        listing.getSeller().getId(),
                        listing.getSeller().getFullName(),
                        listing.getSeller().isStudentVerified()),
                listing.isDemo(),
                listing.isPopular(),
                listing.isStudentDeal(),
                listing.isHostelClearance(),
                discountAvailable,
                discountEligible,
                discountAvailable && discountEligible ? listing.getStudentDiscountedPrice() : null,
                discountAvailable && discountEligible ? listing.getStudentDiscountPercentage() : null,
                discountAvailable && discountEligible
                        ? listing.getPrice().subtract(listing.getStudentDiscountedPrice()) : null,
                listing.getCreatedAt());
    }
}
