package com.city.complaints.security;

import com.city.complaints.entity.Citizen;
import com.city.complaints.entity.Staff;
import com.city.complaints.repository.CitizenRepository;
import com.city.complaints.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resolves a JWT subject (in the format {@code "CITIZEN:email"} or {@code "STAFF:email"})
 * to a Spring Security {@link UserDetails} object.
 *
 * <p>Both citizens and staff share the same Spring Security filter chain but carry
 * different role authorities, allowing the service layer to distinguish them at runtime.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private static final String CITIZEN_PREFIX = "CITIZEN:";
    private static final String STAFF_PREFIX   = "STAFF:";

    private final CitizenRepository citizenRepository;
    private final StaffRepository   staffRepository;

    @Override
    public UserDetails loadUserByUsername(String subject) throws UsernameNotFoundException {
        if (subject.startsWith(CITIZEN_PREFIX)) {
            return loadCitizen(subject.substring(CITIZEN_PREFIX.length()));
        }
        if (subject.startsWith(STAFF_PREFIX)) {
            return loadStaff(subject.substring(STAFF_PREFIX.length()));
        }
        throw new UsernameNotFoundException("Unknown subject format: " + subject);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private UserDetails loadCitizen(String email) {
        Citizen citizen = citizenRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Citizen not found: " + email));

        return new User(
                CITIZEN_PREFIX + citizen.getEmail(),
                citizen.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_CITIZEN"))
        );
    }

    private UserDetails loadStaff(String email) {
        Staff staff = staffRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Staff not found: " + email));

        if (!Boolean.TRUE.equals(staff.getIsActive())) {
            throw new UsernameNotFoundException("Staff account is disabled: " + email);
        }

        return new User(
                STAFF_PREFIX + staff.getEmail(),
                staff.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_STAFF"),
                        new SimpleGrantedAuthority("ROLE_" + staff.getRole().name()))
        );
    }
}
