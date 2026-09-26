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
 * Represents a city department (e.g., "Roads & Highways", "Water Authority").
 */
@Entity
@Table(name = "departments", indexes = {
        @Index(name = "idx_department_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 300)
    private String location;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ─── Relations ────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Staff> staff = new ArrayList<>();

    /** Complaints are NOT deleted when a department is deleted. */
    @OneToMany(mappedBy = "department")
    @Builder.Default
    private List<Complaint> complaints = new ArrayList<>();
}
