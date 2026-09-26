package com.city.complaints.domain.complaint.entity;

import com.city.complaints.domain.citizen.entity.Citizen;
import com.city.complaints.domain.department.entity.Department;
import com.city.complaints.domain.feedback.entity.Feedback;
import com.city.complaints.domain.staff.entity.Staff;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Core entity representing a citizen complaint.
 *
 * <p>Severity and status are stored as enum strings for readability in the database.
 * AI-generated fields (severity, aiSummary, suggestedCategory) are populated
 * asynchronously after the complaint is initially saved.
 */
@Entity
@Table(name = "complaints", indexes = {
        @Index(name = "idx_complaint_status",     columnList = "status"),
        @Index(name = "idx_complaint_severity",   columnList = "severity"),
        @Index(name = "idx_complaint_department", columnList = "department_id"),
        @Index(name = "idx_complaint_citizen",    columnList = "citizen_id"),
        @Index(name = "idx_complaint_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Complaint category — e.g. "Roads", "Water", "Electricity", "Sanitation". */
    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 500)
    private String locationName;

    private Double latitude;
    private Double longitude;

    @Column(length = 1000)
    private String photoUrl;

    // ─── AI-generated fields ──────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Severity severity = Severity.MEDIUM;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(length = 100)
    private String suggestedCategory;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.PENDING;

    // ─── Assignment ───────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private Staff assignedTo;

    // ─── Resolution ───────────────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private LocalDateTime resolvedAt;

    // ─── Metadata ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ─── Relations ────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;

    @OneToOne(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private Feedback feedback;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StatusHistory> statusHistory = new ArrayList<>();
}
