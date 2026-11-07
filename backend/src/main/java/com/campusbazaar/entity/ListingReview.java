package com.campusbazaar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "listing_reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_listing_reviews_listing_reviewer",
                columnNames = {"listing_id", "reviewer_id"}),
        indexes = @Index(name = "idx_listing_reviews_listing_created", columnList = "listing_id, created_at"))
public class ListingReview extends BaseEntity {

    @NotNull
    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comment;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    protected ListingReview() {}

    public ListingReview(Integer rating, String comment, Listing listing, User reviewer) {
        this.rating = rating;
        this.comment = comment;
        this.listing = listing;
        this.reviewer = reviewer;
    }

    public Integer getRating() { return rating; }
    public String getComment() { return comment; }
    public Listing getListing() { return listing; }
    public User getReviewer() { return reviewer; }
}
