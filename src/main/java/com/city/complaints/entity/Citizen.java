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
 * Represents a registered city citizen.
 * Passwords are always stored as BCrypt hashes — never in plain text.
 */
@Entity
@Table(name = "citizens", indexes = {
        @Index(name = "idx_citizen_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Citizen {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** BCrypt-hashed password — never expose in responses. */
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String address;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ─── Relations ────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "citizen", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Complaint> complaints = new ArrayList<>();

    @OneToMany(mappedBy = "citizen", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Feedback> feedbacks = new ArrayList<>();
}
