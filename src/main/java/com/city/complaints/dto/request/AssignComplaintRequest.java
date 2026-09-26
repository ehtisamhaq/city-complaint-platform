package com.city.complaints.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AssignComplaintRequest(

        @NotBlank(message = "Staff ID is required")
        String assignedToId
) {}
