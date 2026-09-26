package com.city.complaints.common.security;

import com.city.complaints.domain.citizen.entity.Citizen;
import com.city.complaints.domain.citizen.repository.CitizenRepository;
import com.city.complaints.domain.staff.entity.Staff;
import com.city.complaints.domain.staff.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final String CITIZEN_PREFIX = "CITIZEN:";
    private static final String STAFF_PREFIX   = "STAFF:";

    private final CitizenRepository citizenRepository;
    private final StaffRepository   staffRepository;

    @Override
    public UserDetails loadUserByUsername(String subject) throws UsernameNotFoundException {
        if (subject.startsWith(CITIZEN_PREFIX)) {
            String email = subject.substring(CITIZEN_PREFIX.length());
            Citizen citizen = citizenRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Citizen not found: " + email));

            return new User(
                    subject,
                    citizen.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_CITIZEN"))
            );

        } else if (subject.startsWith(STAFF_PREFIX)) {
            String email = subject.substring(STAFF_PREFIX.length());
            Staff staff = staffRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Staff member not found: " + email));

            String roleAuthority = "ROLE_" + staff.getRole().name();
            return new User(
                    subject,
                    staff.getPassword(),
                    Boolean.TRUE.equals(staff.getIsActive()),
                    true, true, true,
                    List.of(
                            new SimpleGrantedAuthority(roleAuthority),
                            new SimpleGrantedAuthority("ROLE_STAFF")
                    )
            );
        }

        throw new UsernameNotFoundException("Invalid subject prefix: " + subject);
    }
}
