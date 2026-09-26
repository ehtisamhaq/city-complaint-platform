package com.city.complaints.domain.dashboard.dto;

import com.city.complaints.domain.complaint.dto.ComplaintResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** Dashboard statistics returned to the citizen. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CitizenDashboardResponse(
        CitizenStats           stats,
        List<ComplaintResponse> recentComplaints
) {
    public record CitizenStats(
            long totalComplaints,
            long pending,
            long inProgress,
            long resolved
    ) {}
}
