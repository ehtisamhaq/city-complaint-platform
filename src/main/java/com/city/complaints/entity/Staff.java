package com.city.complaints.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a department staff member.
 * Role is stored as an enum column for type-safety.
 */
@Entity
@Table(name = "staff", indexes = {
        @Index(name = "idx_staff_email", columnList = "email"),
        @Index(name = "idx_staff_department", columnList = "department_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** BCrypt-hashed password. */
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ─── Relations ────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "assignedTo")
    @Builder.Default
    private List<Complaint> assignedComplaints = new ArrayList<>();
}
