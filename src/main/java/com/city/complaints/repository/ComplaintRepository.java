package com.city.complaints.repository;

import com.city.complaints.entity.Complaint;
import com.city.complaints.entity.ComplaintStatus;
import com.city.complaints.entity.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    // ─── Citizen-scoped queries ───────────────────────────────────────────────

    Page<Complaint> findByCitizenId(String citizenId, Pageable pageable);

    long countByCitizenId(String citizenId);

    long countByCitizenIdAndStatus(String citizenId, ComplaintStatus status);

    List<Complaint> findTop5ByCitizenIdOrderByCreatedAtDesc(String citizenId);

    // ─── Staff/Department-scoped queries ─────────────────────────────────────

    Page<Complaint> findByAssignedToId(String staffId, Pageable pageable);

    long countByAssignedToId(String staffId);

    long countByAssignedToIdAndStatus(String staffId, ComplaintStatus status);

    Page<Complaint> findByDepartmentId(String departmentId, Pageable pageable);

    // ─── Filtered listing ────────────────────────────────────────────────────

    @Query("""
            SELECT c FROM Complaint c
            WHERE (:status   IS NULL OR c.status   = :status)
              AND (:severity  IS NULL OR c.severity = :severity)
              AND (:category  IS NULL OR c.category = :category)
            ORDER BY c.createdAt DESC
            """)
    Page<Complaint> findWithFilters(
            @Param("status")   ComplaintStatus status,
            @Param("severity") Severity severity,
            @Param("category") String category,
            Pageable pageable);

    // ─── Dashboard stats ──────────────────────────────────────────────────────

    long countByStatus(ComplaintStatus status);

    long countBySeverity(Severity severity);

    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category")
    List<Object[]> countGroupedByCategory();

    @Query("""
            SELECT d.name, COUNT(c), SUM(CASE WHEN c.status = com.city.complaints.entity.ComplaintStatus.RESOLVED THEN 1L ELSE 0L END)
            FROM Complaint c JOIN c.department d
            GROUP BY d.name
            """)
    List<Object[]> countGroupedByDepartment();
}
