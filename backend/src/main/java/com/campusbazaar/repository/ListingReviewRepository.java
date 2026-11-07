package com.campusbazaar.repository;

import com.campusbazaar.entity.ListingReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ListingReviewRepository extends JpaRepository<ListingReview, Long> {
    List<ListingReview> findByListingIdOrderByCreatedAtDesc(Long listingId);
    boolean existsByListingIdAndReviewerId(Long listingId, Long reviewerId);
    long countByListingId(Long listingId);
    long countByListing_Seller_Id(Long sellerId);

    @Query("select avg(review.rating) from ListingReview review where review.listing.id = :listingId")
    Double averageRatingByListingId(@Param("listingId") Long listingId);

    @Query("select avg(review.rating) from ListingReview review where review.listing.seller.id = :sellerId")
    Double averageRatingBySellerId(@Param("sellerId") Long sellerId);
}
