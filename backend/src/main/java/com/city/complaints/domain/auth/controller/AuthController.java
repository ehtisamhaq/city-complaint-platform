package com.city.complaints.domain.auth.controller;

import com.city.complaints.common.model.ApiResponse;
import com.city.complaints.domain.auth.dto.AuthResponse;
import com.city.complaints.domain.auth.dto.CitizenSignupRequest;
import com.city.complaints.domain.auth.dto.LoginRequest;
import com.city.complaints.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication endpoints (public — no JWT required).
 *
 * <p>Base path: {@code /auth}
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** POST /auth/citizen/signup — register a new citizen. */
    @PostMapping("/citizen/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> citizenSignup(
            @Valid @RequestBody CitizenSignupRequest request) {

        AuthResponse response = authService.signupCitizen(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Citizen registered successfully", response));
    }

    /** POST /auth/citizen/login — citizen login. */
    @PostMapping("/citizen/login")
    public ResponseEntity<ApiResponse<AuthResponse>> citizenLogin(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.loginCitizen(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    /** POST /auth/staff/login — staff login. */
    @PostMapping("/staff/login")
    public ResponseEntity<ApiResponse<AuthResponse>> staffLogin(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.loginStaff(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }
}
