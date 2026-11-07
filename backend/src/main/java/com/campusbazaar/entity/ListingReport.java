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

@Entity
@Table(name = "listing_reports", indexes = {
        @Index(name = "idx_listing_reports_status_created", columnList = "status, created_at"),
        @Index(name = "idx_listing_reports_listing", columnList = "listing_id")
})
public class ListingReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingReportStatus status = ListingReportStatus.OPEN;

    protected ListingReport() {}

    public ListingReport(Listing listing, User reporter, String reason) {
        this.listing = listing;
        this.reporter = reporter;
        this.reason = reason;
    }

    public Listing getListing() { return listing; }
    public User getReporter() { return reporter; }
    public String getReason() { return reason; }
    public ListingReportStatus getStatus() { return status; }
    public void setStatus(ListingReportStatus status) { this.status = status; }
}
