package com.city.complaints.domain.complaint.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateStatusRequest(

        @NotBlank(message = "Status is required")
        String status,

        String note,

        /** When true, the service will call AI to generate a suggested reply. */
        boolean includeAiReply
) {}
