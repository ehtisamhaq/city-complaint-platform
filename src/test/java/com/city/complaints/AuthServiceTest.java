package com.city.complaints;

import com.city.complaints.dto.request.CitizenSignupRequest;
import com.city.complaints.dto.request.LoginRequest;
import com.city.complaints.dto.response.AuthResponse;
import com.city.complaints.entity.Citizen;
import com.city.complaints.entity.Department;
import com.city.complaints.entity.Staff;
import com.city.complaints.entity.StaffRole;
import com.city.complaints.exception.ConflictException;
import com.city.complaints.repository.CitizenRepository;
import com.city.complaints.repository.StaffRepository;
import com.city.complaints.security.JwtProvider;
import com.city.complaints.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private CitizenRepository citizenRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthService authService;

    private CitizenSignupRequest signupRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        signupRequest = new CitizenSignupRequest("test@citizen.com", "Secret123", "John Citizen", "555-1234", "123 Test St");
        loginRequest = new LoginRequest("test@citizen.com", "Secret123");
    }

    @Test
    @DisplayName("Signup Citizen - Success")
    void signupCitizen_Success() {
        when(citizenRepository.existsByEmail("test@citizen.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123")).thenReturn("encodedPassword");

        Citizen savedCitizen = Citizen.builder()
                .id("citizen-uuid-1")
                .email("test@citizen.com")
                .fullName("John Citizen")
                .password("encodedPassword")
                .build();

        when(citizenRepository.save(any(Citizen.class))).thenReturn(savedCitizen);
        when(jwtProvider.generateToken("CITIZEN:test@citizen.com")).thenReturn("mock.jwt.token");
        when(jwtProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.signupCitizen(signupRequest);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("mock.jwt.token");
        assertThat(response.user().email()).isEqualTo("test@citizen.com");
        assertThat(response.user().id()).isEqualTo("citizen-uuid-1");
        verify(citizenRepository, times(1)).save(any(Citizen.class));
    }

    @Test
    @DisplayName("Signup Citizen - Duplicate Email throws ConflictException")
    void signupCitizen_DuplicateEmail_ThrowsException() {
        when(citizenRepository.existsByEmail("test@citizen.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.signupCitizen(signupRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Email already registered");

        verify(citizenRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login Citizen - Success")
    void loginCitizen_Success() {
        Citizen citizen = Citizen.builder()
                .id("citizen-uuid-1")
                .email("test@citizen.com")
                .fullName("John Citizen")
                .password("encodedPassword")
                .build();

        when(citizenRepository.findByEmail("test@citizen.com")).thenReturn(Optional.of(citizen));
        when(passwordEncoder.matches("Secret123", "encodedPassword")).thenReturn(true);
        when(jwtProvider.generateToken("CITIZEN:test@citizen.com")).thenReturn("mock.jwt.token");
        when(jwtProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.loginCitizen(loginRequest);

        assertThat(response.token()).isEqualTo("mock.jwt.token");
        assertThat(response.user().email()).isEqualTo("test@citizen.com");
    }

    @Test
    @DisplayName("Login Staff - Success")
    void loginStaff_Success() {
        LoginRequest staffLogin = new LoginRequest("staff@city.gov", "Secret123");
        Department department = Department.builder().id("dept-1").name("Roads").build();

        Staff staff = Staff.builder()
                .id("staff-uuid-10")
                .email("staff@city.gov")
                .fullName("Staff Member")
                .password("encodedPassword")
                .role(StaffRole.TECHNICIAN)
                .department(department)
                .isActive(true)
                .build();

        when(staffRepository.findByEmail("staff@city.gov")).thenReturn(Optional.of(staff));
        when(passwordEncoder.matches("Secret123", "encodedPassword")).thenReturn(true);
        when(jwtProvider.generateToken("STAFF:staff@city.gov")).thenReturn("staff.jwt.token");
        when(jwtProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.loginStaff(staffLogin);

        assertThat(response.token()).isEqualTo("staff.jwt.token");
        assertThat(response.user().email()).isEqualTo("staff@city.gov");
        assertThat(response.user().role()).isEqualTo("TECHNICIAN");
        assertThat(response.user().departmentName()).isEqualTo("Roads");
    }

    @Test
    @DisplayName("Login - Invalid Password throws BadCredentialsException")
    void login_InvalidPassword_ThrowsException() {
        Citizen citizen = Citizen.builder()
                .id("citizen-uuid-1")
                .email("test@citizen.com")
                .password("encodedPassword")
                .build();

        when(citizenRepository.findByEmail("test@citizen.com")).thenReturn(Optional.of(citizen));
        when(passwordEncoder.matches("Secret123", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.loginCitizen(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");
    }
}
