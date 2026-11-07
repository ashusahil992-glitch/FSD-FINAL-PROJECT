package com.campusbazaar.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "wishlist_entries",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_wishlist_user_listing", columnNames = {"user_id", "listing_id"}),
        indexes = {
                @Index(name = "idx_wishlist_user_created", columnList = "user_id, created_at"),
                @Index(name = "idx_wishlist_listing", columnList = "listing_id")
        })
public class WishlistEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Listing listing;

    protected WishlistEntry() {}

    public WishlistEntry(User user, Listing listing) {
        this.user = user;
        this.listing = listing;
    }

    public User getUser() { return user; }
    public Listing getListing() { return listing; }
}
