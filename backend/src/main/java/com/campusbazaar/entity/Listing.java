package com.campusbazaar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "listings", indexes = {
        @Index(name = "idx_listings_status_created", columnList = "status, created_at"),
        @Index(name = "idx_listings_category_status", columnList = "category_id, status")
})
public class Listing extends BaseEntity {

    @NotBlank
    @Column(nullable = false, length = 140)
    private String title;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull
    @DecimalMin("0.00")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "`condition`", nullable = false, length = 20)
    private ListingCondition condition;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingType listingType = ListingType.SALE;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingStatus status = ListingStatus.AVAILABLE;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private boolean demo = false;

    @Column(nullable = false)
    private boolean popular = false;

    @Column(nullable = false)
    private boolean studentDeal = false;

    @Column(name = "student_discount_enabled", nullable = false)
    private boolean studentDiscountEnabled = false;

    @Column(name = "student_discounted_price", precision = 10, scale = 2)
    private BigDecimal studentDiscountedPrice;

    @Column(name = "student_discount_percentage", precision = 5, scale = 2)
    private BigDecimal studentDiscountPercentage;

    @Column(nullable = false)
    private boolean hostelClearance = false;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    protected Listing() {}

    public Listing(String title, String description, BigDecimal price, ListingCondition condition,
                   ListingType listingType, String imageUrl, Category category, User seller) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.condition = condition;
        this.listingType = listingType;
        this.imageUrl = imageUrl;
        this.category = category;
        this.seller = seller;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public ListingCondition getCondition() { return condition; }
    public ListingType getListingType() { return listingType; }
    public ListingStatus getStatus() { return status; }
    public String getImageUrl() { return imageUrl; }
    public boolean isDemo() { return demo; }
    public boolean isPopular() { return popular; }
    public boolean isStudentDeal() { return studentDeal; }
    public boolean isStudentDiscountEnabled() { return studentDiscountEnabled; }
    public BigDecimal getStudentDiscountedPrice() { return studentDiscountedPrice; }
    public BigDecimal getStudentDiscountPercentage() { return studentDiscountPercentage; }
    public boolean isHostelClearance() { return hostelClearance; }
    public Category getCategory() { return category; }
    public User getSeller() { return seller; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setCondition(ListingCondition condition) { this.condition = condition; }
    public void setListingType(ListingType listingType) { this.listingType = listingType; }
    public void setCategory(Category category) { this.category = category; }
    public void setStatus(ListingStatus status) { this.status = status; }
    public void setDemo(boolean demo) { this.demo = demo; }
    public void setPopular(boolean popular) { this.popular = popular; }
    public void setStudentDeal(boolean studentDeal) { this.studentDeal = studentDeal; }
    public void setStudentDiscount(boolean enabled, BigDecimal discountedPrice, BigDecimal discountPercentage) {
        this.studentDiscountEnabled = enabled;
        this.studentDiscountedPrice = enabled ? discountedPrice : null;
        this.studentDiscountPercentage = enabled ? discountPercentage : null;
    }
    public void setHostelClearance(boolean hostelClearance) { this.hostelClearance = hostelClearance; }
}
