package com.city.complaints.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/** Public-facing platform-wide statistics (no authentication required). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PublicStatisticsResponse(
        PlatformStats           stats,
        Map<String, Long>       byCategory,
        List<DepartmentStat>    byDepartment
) {
    public record PlatformStats(
            long totalComplaints,
            long resolved,
            long pending,
            long inProgress
    ) {}

    public record DepartmentStat(
            String name,
            long   total,
            long   resolved
    ) {}
}
