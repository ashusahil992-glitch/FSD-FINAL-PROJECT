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
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "campus_posts", indexes = {
        @Index(name = "idx_campus_posts_university_created", columnList = "university_id, created_at"),
        @Index(name = "idx_campus_posts_status", columnList = "status")
})
public class CampusPost extends BaseEntity {

    @NotBlank
    @Column(nullable = false, length = 140)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 2000)
    private String description;

    @NotBlank
    @Column(nullable = false, length = 180)
    private String location;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampusPostType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampusPostStatus status = CampusPostStatus.OPEN;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    protected CampusPost() {}

    public CampusPost(String title, String description, String location, CampusPostType type,
                      User author, University university) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.type = type;
        this.author = author;
        this.university = university;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public CampusPostType getType() { return type; }
    public CampusPostStatus getStatus() { return status; }
    public User getAuthor() { return author; }
    public University getUniversity() { return university; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setLocation(String location) { this.location = location; }
    public void setType(CampusPostType type) { this.type = type; }
    public void setStatus(CampusPostStatus status) { this.status = status; }
}
