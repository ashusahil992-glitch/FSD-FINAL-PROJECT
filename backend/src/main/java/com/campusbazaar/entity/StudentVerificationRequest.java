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
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

@Entity
@Table(name = "student_verification_requests", indexes = {
        @Index(name = "idx_verification_student_created", columnList = "student_id, created_at"),
        @Index(name = "idx_verification_status_created", columnList = "status, created_at")
})
public class StudentVerificationRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String documentKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus status = VerificationStatus.PENDING;

    @Column(length = 1000)
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    private Instant reviewedAt;

    protected StudentVerificationRequest() {}

    public StudentVerificationRequest(User student, String documentKey) {
        this.student = student;
        this.documentKey = documentKey;
    }

    public User getStudent() { return student; }
    public String getDocumentKey() { return documentKey; }
    public VerificationStatus getStatus() { return status; }
    public String getRejectionReason() { return rejectionReason; }
    public User getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }

    public void approve(User reviewer) {
        this.status = VerificationStatus.VERIFIED;
        this.rejectionReason = null;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
    }

    public void reject(User reviewer, String reason) {
        this.status = VerificationStatus.REJECTED;
        this.rejectionReason = reason;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
    }
}
