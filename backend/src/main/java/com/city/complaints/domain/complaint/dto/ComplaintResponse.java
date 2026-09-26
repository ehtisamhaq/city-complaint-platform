package com.city.complaints.domain.complaint.dto;

import com.city.complaints.domain.complaint.entity.Complaint;
import com.city.complaints.domain.complaint.entity.ComplaintStatus;
import com.city.complaints.domain.complaint.entity.Severity;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Public-facing complaint representation.
 * Uses a nested {@link AssigneeInfo} to avoid exposing the full Staff entity.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ComplaintResponse(
        String          id,
        String          title,
        String          description,
        String          category,
        String          locationName,
        Double          latitude,
        Double          longitude,
        String          photoUrl,
        Severity        severity,
        Double          severityScore,
        String          objectType,
        String          objectMeasurement,
        String          aiSummary,
        String          suggestedCategory,
        ComplaintStatus status,
        String          resolutionNotes,
        LocalDateTime   resolvedAt,
        LocalDateTime   createdAt,
        LocalDateTime   updatedAt,
        CitizenInfo     citizen,
        AssigneeInfo    assignedTo,
        String          departmentName,
        List<StatusHistoryInfo> statusHistory
) {

    public record CitizenInfo(String id, String fullName, String email) {}

    public record AssigneeInfo(String id, String fullName, String email) {}

    public record StatusHistoryInfo(
            String          status,
            String          note,
            String          changedBy,
            LocalDateTime   createdAt
    ) {}

    // ─── Static factory ───────────────────────────────────────────────────────

    public static ComplaintResponse from(Complaint c) {
        CitizenInfo citizenInfo = c.getCitizen() == null ? null :
                new CitizenInfo(c.getCitizen().getId(),
                        c.getCitizen().getFullName(),
                        c.getCitizen().getEmail());

        AssigneeInfo assigneeInfo = c.getAssignedTo() == null ? null :
                new AssigneeInfo(c.getAssignedTo().getId(),
                        c.getAssignedTo().getFullName(),
                        c.getAssignedTo().getEmail());

        String deptName = c.getDepartment() == null ? null : c.getDepartment().getName();

        List<StatusHistoryInfo> history = c.getStatusHistory() == null ? List.of() :
                c.getStatusHistory().stream()
                        .map(h -> new StatusHistoryInfo(
                                h.getStatus().name(),
                                h.getNote(),
                                h.getChangedBy(),
                                h.getCreatedAt()))
                        .toList();

        return new ComplaintResponse(
                c.getId(), c.getTitle(), c.getDescription(), c.getCategory(),
                c.getLocationName(), c.getLatitude(), c.getLongitude(), c.getPhotoUrl(),
                c.getSeverity(), c.getSeverityScore(), c.getObjectType(), c.getObjectMeasurement(),
                c.getAiSummary(), c.getSuggestedCategory(),
                c.getStatus(), c.getResolutionNotes(), c.getResolvedAt(),
                c.getCreatedAt(), c.getUpdatedAt(),
                citizenInfo, assigneeInfo, deptName, history
        );
    }
}
