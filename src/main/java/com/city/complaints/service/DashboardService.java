package com.city.complaints.service;

import com.city.complaints.dto.response.*;
import com.city.complaints.entity.ComplaintStatus;
import com.city.complaints.entity.Severity;
import com.city.complaints.exception.ResourceNotFoundException;
import com.city.complaints.repository.CitizenRepository;
import com.city.complaints.repository.ComplaintRepository;
import com.city.complaints.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregates statistics for citizen dashboards, staff dashboards, and the public board.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ComplaintRepository complaintRepository;
    private final CitizenRepository   citizenRepository;
    private final StaffRepository     staffRepository;

    // ─── Citizen dashboard ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CitizenDashboardResponse getCitizenDashboard(String citizenEmail) {
        String email = stripPrefix(citizenEmail, "CITIZEN:");
        var citizen = citizenRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found: " + email));

        String id = citizen.getId();

        var stats = new CitizenDashboardResponse.CitizenStats(
                complaintRepository.countByCitizenId(id),
                complaintRepository.countByCitizenIdAndStatus(id, ComplaintStatus.PENDING),
                complaintRepository.countByCitizenIdAndStatus(id, ComplaintStatus.IN_PROGRESS),
                complaintRepository.countByCitizenIdAndStatus(id, ComplaintStatus.RESOLVED)
        );

        var recent = complaintRepository
                .findTop5ByCitizenIdOrderByCreatedAtDesc(id)
                .stream()
                .map(ComplaintResponse::from)
                .toList();

        return new CitizenDashboardResponse(stats, recent);
    }

    // ─── Staff dashboard ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StaffDashboardResponse getStaffDashboard(String staffEmail) {
        String email = stripPrefix(staffEmail, "STAFF:");
        var staff = staffRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + email));

        String id = staff.getId();

        long highPriority = complaintRepository
                .findByAssignedToId(id, PageRequest.of(0, Integer.MAX_VALUE, Sort.unsorted()))
                .stream()
                .filter(c -> c.getSeverity() == Severity.HIGH || c.getSeverity() == Severity.CRITICAL)
                .count();

        var stats = new StaffDashboardResponse.StaffStats(
                complaintRepository.countByAssignedToId(id),
                complaintRepository.countByAssignedToIdAndStatus(id, ComplaintStatus.PENDING),
                complaintRepository.countByAssignedToIdAndStatus(id, ComplaintStatus.IN_PROGRESS),
                complaintRepository.countByAssignedToIdAndStatus(id, ComplaintStatus.RESOLVED),
                highPriority
        );

        var assigned = complaintRepository
                .findByAssignedToId(id, PageRequest.of(0, 10, Sort.by("createdAt").descending()))
                .stream()
                .map(ComplaintResponse::from)
                .toList();

        return new StaffDashboardResponse(stats, assigned);
    }

    // ─── Public statistics ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PublicStatisticsResponse getPublicStatistics() {
        long total    = complaintRepository.count();
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long pending  = complaintRepository.countByStatus(ComplaintStatus.PENDING);
        long inProg   = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);

        var platformStats = new PublicStatisticsResponse.PlatformStats(total, resolved, pending, inProg);

        // Build category map preserving insertion order
        Map<String, Long> byCategory = new LinkedHashMap<>();
        complaintRepository.countGroupedByCategory()
                .forEach(row -> byCategory.put((String) row[0], (Long) row[1]));

        // Build department stats
        List<PublicStatisticsResponse.DepartmentStat> byDept =
                complaintRepository.countGroupedByDepartment().stream()
                        .map(row -> new PublicStatisticsResponse.DepartmentStat(
                                (String) row[0],
                                (Long)   row[1],
                                ((Number) row[2]).longValue()
                        ))
                        .toList();

        return new PublicStatisticsResponse(platformStats, byCategory, byDept);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private String stripPrefix(String subject, String prefix) {
        return subject.startsWith(prefix) ? subject.substring(prefix.length()) : subject;
    }
}
