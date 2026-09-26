package com.city.complaints.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Citizen feedback submitted after a complaint is resolved.
 * One-to-one with Complaint — a complaint can only have a single feedback entry.
 */
@Entity
@Table(name = "feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    /** Rating between 1 (poor) and 5 (excellent). */
    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ─── Relations ────────────────────────────────────────────────────────────

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false, unique = true)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;
}
