package com.city.complaints.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

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
