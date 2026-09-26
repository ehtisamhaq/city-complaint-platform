package com.city.complaints.domain.dashboard.dto;

import com.city.complaints.domain.complaint.dto.ComplaintResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** Dashboard statistics returned to staff members. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record StaffDashboardResponse(
        StaffStats              stats,
        List<ComplaintResponse> assignedComplaints
) {
    public record StaffStats(
            long totalAssigned,
            long pending,
            long inProgress,
            long resolved,
            long highPriorityCount
    ) {}
}
