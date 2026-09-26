package com.city.complaints.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Immutable audit trail entry recording every status transition of a complaint.
 */
@Entity
@Table(name = "status_history", indexes = {
        @Index(name = "idx_sh_complaint", columnList = "complaint_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHistory {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status;

    /** Optional note added during a status change. */
    @Column(columnDefinition = "TEXT")
    private String note;

    /** Who triggered this transition (staff email or "SYSTEM"). */
    @Column(length = 255)
    private String changedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ─── Relations ────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;
}
