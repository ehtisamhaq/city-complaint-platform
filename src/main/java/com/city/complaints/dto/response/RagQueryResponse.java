package com.city.complaints.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RagQueryResponse(
        String answer,
        List<SourceInfo> sources,
        List<String> suggestedActions,
        boolean isComplaintContextIncluded
) {
    public record SourceInfo(
            String title,
            String category,
            String excerpt
    ) {}
}
