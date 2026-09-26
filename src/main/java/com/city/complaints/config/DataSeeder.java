package com.city.complaints.config;

import com.city.complaints.entity.*;
import com.city.complaints.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds initial demo data on startup (only when profile != "prod").
 *
 * <p>This gives you working credentials immediately after starting the app for the first time.
 * <br>
 * <b>Citizen:</b> citizen@demo.com / Password123<br>
 * <b>Staff (Admin):</b> admin@roads.gov / Password123<br>
 * <b>Staff (Technician):</b> tech@roads.gov / Password123
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final CitizenRepository    citizenRepository;
    private final DepartmentRepository departmentRepository;
    private final StaffRepository      staffRepository;
    private final PasswordEncoder      passwordEncoder;

    @Bean
    @Profile("!prod & !test")   // Skipped in production and test profiles
    public CommandLineRunner seedData() {
        return args -> {
            if (citizenRepository.count() > 0) {
                log.info("Database already seeded — skipping.");
                return;
            }

            log.info("Seeding demo data...");

            // ── Departments ────────────────────────────────────────────────
            Department roads = Department.builder()
                    .name("Roads & Highways")
                    .email("roads@city.gov")
                    .phone("555-1001")
                    .location("City Hall, Block A")
                    .build();

            Department water = Department.builder()
                    .name("Water & Sanitation")
                    .email("water@city.gov")
                    .phone("555-1002")
                    .location("City Hall, Block B")
                    .build();

            Department electricity = Department.builder()
                    .name("Electricity Board")
                    .email("electricity@city.gov")
                    .phone("555-1003")
                    .location("City Hall, Block C")
                    .build();

            roads       = departmentRepository.save(roads);
            water       = departmentRepository.save(water);
            electricity = departmentRepository.save(electricity);

            // ── Staff ──────────────────────────────────────────────────────
            Staff admin = Staff.builder()
                    .email("admin@roads.gov")
                    .password(passwordEncoder.encode("Password123"))
                    .fullName("Alice Admin")
                    .role(StaffRole.ADMIN)
                    .department(roads)
                    .isActive(true)
                    .build();

            Staff tech = Staff.builder()
                    .email("tech@roads.gov")
                    .password(passwordEncoder.encode("Password123"))
                    .fullName("Bob Technician")
                    .role(StaffRole.TECHNICIAN)
                    .department(roads)
                    .isActive(true)
                    .build();

            staffRepository.save(admin);
            staffRepository.save(tech);

            // ── Citizen ────────────────────────────────────────────────────
            Citizen citizen = Citizen.builder()
                    .email("citizen@demo.com")
                    .password(passwordEncoder.encode("Password123"))
                    .fullName("John Citizen")
                    .phone("555-2001")
                    .address("123 Main Street, City")
                    .build();

            citizenRepository.save(citizen);

            log.info("Demo data seeded successfully.");
            log.info("Citizen login:        citizen@demo.com / Password123");
            log.info("Staff (Admin) login:  admin@roads.gov  / Password123");
            log.info("Staff (Tech) login:   tech@roads.gov   / Password123");
        };
    }
}
