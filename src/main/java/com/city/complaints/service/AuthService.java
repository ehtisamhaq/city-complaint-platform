package com.city.complaints.service;

import com.city.complaints.dto.request.CitizenSignupRequest;
import com.city.complaints.dto.request.LoginRequest;
import com.city.complaints.dto.response.AuthResponse;
import com.city.complaints.entity.Citizen;
import com.city.complaints.entity.Staff;
import com.city.complaints.exception.ConflictException;
import com.city.complaints.exception.ResourceNotFoundException;
import com.city.complaints.repository.CitizenRepository;
import com.city.complaints.repository.StaffRepository;
import com.city.complaints.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles citizen signup and login / staff login.
 *
 * <p>Passwords are always encoded before persistence — plain text never touches
 * the database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String CITIZEN_PREFIX = "CITIZEN:";
    private static final String STAFF_PREFIX   = "STAFF:";

    private final CitizenRepository citizenRepository;
    private final StaffRepository   staffRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtProvider       jwtProvider;

    // ─── Citizen signup ───────────────────────────────────────────────────────

    @Transactional
    public AuthResponse signupCitizen(CitizenSignupRequest request) {
        if (citizenRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already registered: " + request.email());
        }

        Citizen citizen = Citizen.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .address(request.address())
                .build();

        citizen = citizenRepository.save(citizen);
        log.info("New citizen registered: {}", citizen.getEmail());

        String token = jwtProvider.generateToken(CITIZEN_PREFIX + citizen.getEmail());
        return buildCitizenAuthResponse(citizen, token);
    }

    // ─── Citizen login ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse loginCitizen(LoginRequest request) {
        Citizen citizen = citizenRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), citizen.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtProvider.generateToken(CITIZEN_PREFIX + citizen.getEmail());
        log.info("Citizen login: {}", citizen.getEmail());
        return buildCitizenAuthResponse(citizen, token);
    }

    // ─── Staff login ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse loginStaff(LoginRequest request) {
        Staff staff = staffRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!Boolean.TRUE.equals(staff.getIsActive())) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.password(), staff.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtProvider.generateToken(STAFF_PREFIX + staff.getEmail());
        log.info("Staff login: {} ({})", staff.getEmail(), staff.getRole());
        return buildStaffAuthResponse(staff, token);
    }

    // ─── Private builders ─────────────────────────────────────────────────────

    private AuthResponse buildCitizenAuthResponse(Citizen citizen, String token) {
        return new AuthResponse(
                token,
                "Bearer",
                jwtProvider.getExpirationMs() / 1000,
                new AuthResponse.UserInfo(citizen.getId(), citizen.getEmail(),
                        citizen.getFullName(), null, null)
        );
    }

    private AuthResponse buildStaffAuthResponse(Staff staff, String token) {
        String deptName = staff.getDepartment() != null
                ? staff.getDepartment().getName() : null;

        return new AuthResponse(
                token,
                "Bearer",
                jwtProvider.getExpirationMs() / 1000,
                new AuthResponse.UserInfo(staff.getId(), staff.getEmail(),
                        staff.getFullName(), staff.getRole().name(), deptName)
        );
    }
}
