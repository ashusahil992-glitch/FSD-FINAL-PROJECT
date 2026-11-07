package com.campusbazaar.service;

import com.campusbazaar.dto.CreateListingReviewRequest;
import com.campusbazaar.dto.ListingReviewDto;
import com.campusbazaar.dto.ListingReviewSummaryDto;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingReview;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.ConflictException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.ListingReviewRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListingReviewService {

    private final ListingRepository listingRepository;
    private final ListingReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final StudentAccessService studentAccessService;

    public ListingReviewService(ListingRepository listingRepository, ListingReviewRepository reviewRepository,
                               UserRepository userRepository, StudentAccessService studentAccessService) {
        this.listingRepository = listingRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.studentAccessService = studentAccessService;
    }

    @Transactional(readOnly = true)
    public ListingReviewSummaryDto getReviews(Long listingId, String reviewerEmail) {
        Listing listing = findAvailableListing(listingId);
        Long reviewerId = reviewerEmail == null ? null : userRepository.findByEmailIgnoreCase(reviewerEmail)
                .map(User::getId)
                .orElse(null);
        List<ListingReviewDto> reviews = reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId)
                .stream()
                .map(this::toDto)
                .toList();
        return new ListingReviewSummaryDto(
                reviews,
                reviewRepository.averageRatingByListingId(listingId),
                reviewRepository.countByListingId(listingId),
                reviewRepository.averageRatingBySellerId(listing.getSeller().getId()),
                reviewRepository.countByListing_Seller_Id(listing.getSeller().getId()),
                reviewerId != null && reviewRepository.existsByListingIdAndReviewerId(listingId, reviewerId));
    }

    @Transactional
    public ListingReviewSummaryDto createReview(Long listingId, CreateListingReviewRequest request, String reviewerEmail) {
        Listing listing = findAvailableListing(listingId);
        User reviewer = studentAccessService.requireVerified(reviewerEmail);
        if (listing.getSeller().getId().equals(reviewer.getId())) {
            throw new AccessDeniedException("You cannot review your own listing.");
        }
        if (reviewRepository.existsByListingIdAndReviewerId(listingId, reviewer.getId())) {
            throw new ConflictException("You have already reviewed this listing.");
        }

        String comment = request.comment() == null ? null : request.comment().trim();
        ListingReview review = new ListingReview(request.rating(), comment == null || comment.isEmpty() ? null : comment,
                listing, reviewer);
        try {
            reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("You have already reviewed this listing.");
        }
        return getReviews(listingId, reviewerEmail);
    }

    private Listing findAvailableListing(Long listingId) {
        return listingRepository.findByIdAndStatus(listingId, ListingStatus.AVAILABLE)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
    }

    private ListingReviewDto toDto(ListingReview review) {
        return new ListingReviewDto(
                review.getId(),
                review.getRating(),
                review.getComment(),
                review.getReviewer().getFullName(),
                review.getCreatedAt());
    }
}
