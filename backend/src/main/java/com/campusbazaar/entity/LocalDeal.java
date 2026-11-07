package com.campusbazaar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "local_deals", indexes = {
        @Index(name = "idx_local_deals_expiration", columnList = "valid_until, created_at"),
        @Index(name = "idx_local_deals_category", columnList = "category")
})
public class LocalDeal extends BaseEntity {

    @Column(nullable = false, length = 140)
    private String businessName;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 500)
    private String offer;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 80)
    private String couponCode;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false, length = 180)
    private String location;

    @Column(length = 500)
    private String redemptionUrl;

    @NotNull
    @FutureOrPresent
    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    private User submittedBy;

    protected LocalDeal() {}

    public LocalDeal(String businessName, String title, String offer, String description, String couponCode,
                     String category, String location, String redemptionUrl, LocalDate validUntil, User submittedBy) {
        this.businessName = businessName;
        this.title = title;
        this.offer = offer;
        this.description = description;
        this.couponCode = couponCode;
        this.category = category;
        this.location = location;
        this.redemptionUrl = redemptionUrl;
        this.validUntil = validUntil;
        this.submittedBy = submittedBy;
    }

    public String getBusinessName() { return businessName; }
    public String getTitle() { return title; }
    public String getOffer() { return offer; }
    public String getDescription() { return description; }
    public String getCouponCode() { return couponCode; }
    public String getCategory() { return category; }
    public String getLocation() { return location; }
    public String getRedemptionUrl() { return redemptionUrl; }
    public LocalDate getValidUntil() { return validUntil; }
    public User getSubmittedBy() { return submittedBy; }
}
