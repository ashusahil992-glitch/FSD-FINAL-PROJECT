package com.campusbazaar.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "conversations",
        uniqueConstraints = @UniqueConstraint(name = "uk_conversation_listing_buyer", columnNames = {"listing_id", "buyer_id"}),
        indexes = @Index(name = "idx_conversations_seller", columnList = "seller_id"))
public class Conversation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @jakarta.persistence.Column(nullable = false)
    private Instant lastMessageAt;

    protected Conversation() {}

    public Conversation(Listing listing, User buyer, User seller) {
        this.listing = listing;
        this.buyer = buyer;
        this.seller = seller;
        this.lastMessageAt = Instant.now();
    }

    public Listing getListing() { return listing; }
    public User getBuyer() { return buyer; }
    public User getSeller() { return seller; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public void touch() { this.lastMessageAt = Instant.now(); }
    public boolean hasParticipant(Long userId) {
        return buyer.getId().equals(userId) || seller.getId().equals(userId);
    }
    public User otherParticipant(Long userId) {
        return buyer.getId().equals(userId) ? seller : buyer;
    }
}
