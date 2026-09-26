package com.city.complaints.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Auth response returned after successful login or signup.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String token,
        String tokenType,
        long   expiresIn,    // seconds
        UserInfo user
) {
    /**
     * Minimal user info embedded in auth response.
     * Deliberately excludes password and sensitive fields.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserInfo(
            String id,
            String email,
            String fullName,
            String role,            // null for citizens
            String departmentName   // null for citizens
    ) {}
}
