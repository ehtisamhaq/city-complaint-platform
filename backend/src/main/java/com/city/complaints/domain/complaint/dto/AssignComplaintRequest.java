package com.city.complaints.domain.complaint.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignComplaintRequest(

        @NotBlank(message = "Staff ID is required")
        String assignedToId
) {}
