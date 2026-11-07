package com.campusbazaar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

@Entity
@Table(name = "user_notifications",
        indexes = {
                @Index(name = "idx_notifications_recipient_created", columnList = "recipient_id, created_at"),
                @Index(name = "idx_notifications_recipient_read_created", columnList = "recipient_id, read_at, created_at")
        },
        uniqueConstraints = @UniqueConstraint(name = "uk_notifications_event_key", columnNames = "event_key"))
public class UserNotification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @Column(length = 120)
    private String title;

    @Column(nullable = false, length = 300)
    private String message;

    @Column(nullable = false, length = 30)
    private String type = "MESSAGE";

    @Column(length = 200)
    private String targetUrl;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "event_key", length = 160)
    private String eventKey;

    private Instant readAt;

    protected UserNotification() {}

    public UserNotification(User recipient, User actor, Conversation conversation, String message) {
        this.recipient = recipient;
        this.actor = actor;
        this.conversation = conversation;
        this.relatedEntityId = conversation == null ? null : conversation.getId();
        this.message = message;
        this.type = "MESSAGE";
        this.title = "New message";
    }

    public UserNotification(User recipient, User actor, String message, String type, String targetUrl) {
        this(recipient, actor, type, message, type, targetUrl, null, null, null);
    }

    public UserNotification(User recipient, User actor, String title, String message, String type,
                            String targetUrl, Conversation conversation, Long relatedEntityId, String eventKey) {
        this.recipient = recipient;
        this.actor = actor;
        this.title = title;
        this.message = message;
        this.type = type;
        this.targetUrl = targetUrl;
        this.conversation = conversation;
        this.relatedEntityId = relatedEntityId;
        this.eventKey = eventKey;
    }

    public User getRecipient() { return recipient; }
    public User getActor() { return actor; }
    public Conversation getConversation() { return conversation; }
    public String getTitle() { return title == null ? message : title; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public String getTargetUrl() { return targetUrl; }
    public Long getRelatedEntityId() { return relatedEntityId; }
    public Instant getReadAt() { return readAt; }
    public String getEventKey() { return eventKey; }
    public void markRead() {
        if (readAt == null) readAt = Instant.now();
    }

    @PrePersist
    void ensureTitle() {
        if (title == null || title.isBlank()) title = "CampusBazaar notification";
    }
}
