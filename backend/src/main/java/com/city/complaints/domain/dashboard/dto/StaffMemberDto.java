package com.city.complaints.domain.dashboard.dto;

/** Lightweight staff member projection for the assign-dropdown in the frontend. */
public record StaffMemberDto(
        String id,
        String fullName,
        String email,
        String role,
        String departmentName
) {}
