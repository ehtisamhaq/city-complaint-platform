package com.city.complaints.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String token,
        String tokenType,
        long   expiresIn,
        UserInfo user
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserInfo(
            String id,
            String email,
            String fullName,
            String role,
            String departmentName
    ) {}
}
