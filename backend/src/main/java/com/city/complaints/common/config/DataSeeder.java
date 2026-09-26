package com.city.complaints.common.config;

import com.city.complaints.domain.citizen.entity.Citizen;
import com.city.complaints.domain.citizen.repository.CitizenRepository;
import com.city.complaints.domain.complaint.entity.Complaint;
import com.city.complaints.domain.complaint.entity.ComplaintStatus;
import com.city.complaints.domain.complaint.entity.Severity;
import com.city.complaints.domain.complaint.repository.ComplaintRepository;
import com.city.complaints.domain.department.entity.Department;
import com.city.complaints.domain.department.repository.DepartmentRepository;
import com.city.complaints.domain.staff.entity.Staff;
import com.city.complaints.domain.staff.entity.StaffRole;
import com.city.complaints.domain.staff.repository.StaffRepository;
import com.city.complaints.domain.rag.entity.KnowledgeArticle;
import com.city.complaints.domain.rag.repository.KnowledgeArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

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

    private final CitizenRepository          citizenRepository;
    private final DepartmentRepository       departmentRepository;
    private final StaffRepository            staffRepository;
    private final ComplaintRepository        complaintRepository;
    private final KnowledgeArticleRepository knowledgeRepository;
    private final PasswordEncoder            passwordEncoder;

    @Bean
    @Profile("!prod & !test")   // Skipped in production and test profiles
    public CommandLineRunner seedData() {
        return args -> {
            if (citizenRepository.count() > 0) {
                log.info("Database already seeded — skipping.");
                return;
            }

            log.info("Seeding demo data & municipal knowledge base...");

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

            // ── Municipal Knowledge Base (for RAG) ─────────────────────────
            List<KnowledgeArticle> articles = List.of(
                    KnowledgeArticle.builder()
                            .title("Pothole & Road Damage Resolution SLAs")
                            .category("Roads & Highways")
                            .tags("pothole,road,asphalt,crater,traffic,damage,highway")
                            .content("Pothole reports are assessed by severity: CRITICAL potholes (causing immediate vehicle damage or hazard) are patched within 24 hours. HIGH severity potholes on main avenues are fixed within 48 hours. Standard residential street repairs take 3 to 5 business days. Contact Roads dept at 555-1001.")
                            .build(),
                    KnowledgeArticle.builder()
                            .title("Water Pipeline Leaks & Supply Interruption Protocol")
                            .category("Water & Sanitation")
                            .tags("water,leak,pipe,burst,supply,drain,sewage,flood")
                            .content("Main water pipe bursts and flooding are treated as CRITICAL emergency with on-site technician response within 4 hours. Low water pressure and minor leaks are investigated within 24-48 hours. For water contamination emergencies, call the 24/7 hotline 555-1002.")
                            .build(),
                    KnowledgeArticle.builder()
                            .title("Streetlight Outages & Electrical Safety Guidelines")
                            .category("Electricity Board")
                            .tags("electricity,streetlight,dark,power,outage,wire,lamp,pole")
                            .content("Fallen power lines or exposed sparking wires are CRITICAL hazards — stay at least 30 feet away and call 555-1003 immediately. Street light outages on neighborhood streets are replaced within 3 business days.")
                            .build(),
                    KnowledgeArticle.builder()
                            .title("Municipal Waste Collection & Bulk Trash Schedule")
                            .category("Sanitation & Waste")
                            .tags("trash,garbage,waste,recycling,pickup,bin,dumpster")
                            .content("Residential waste is collected Mondays and Thursdays between 6:00 AM - 11:00 AM. Recycling is collected on Wednesdays. For bulk item disposal (furniture, appliances), schedule a special pickup at least 48 hours in advance.")
                            .build(),
                    KnowledgeArticle.builder()
                            .title("Complaint Escalation & Citizen Review Policy")
                            .category("General Policy")
                            .tags("appeal,escalate,review,feedback,rating,complaint,unsatisfied")
                            .content("If your complaint has not been addressed within the published SLA timeframe or is resolved unsatisfactorily, you can submit feedback with a low rating (1-2 stars) which automatically flags the case for Supervisor review.")
                            .build(),
                    KnowledgeArticle.builder()
                            .title("Emergency Contacts & City Hall Working Hours")
                            .category("City Hall")
                            .tags("emergency,hotline,hours,office,contact,phone,city hall")
                            .content("City Hall offices are open Monday through Friday from 8:30 AM to 5:00 PM. Emergency dispatch for police/fire is 911. City Public Works dispatch is 555-1000. Online complaint filing is available 24/7.")
                            .build()
            );

            knowledgeRepository.saveAll(articles);

            // ── Demo Complaints ──────────────────────────────────────────
            Complaint p1 = Complaint.builder()
                    .title("Deep Asphalt Pothole on Main St")
                    .description("Sub-surface crater in northbound bike lane causing vehicles to swerve into pedestrian crosswalk.")
                    .category("ROADS")
                    .locationName("442 Main St (Westbound Lane)")
                    .latitude(40.7128)
                    .longitude(-74.006)
                    .severity(Severity.CRITICAL)
                    .severityScore(0.884)
                    .objectType("ROAD_CAVITY_STRUCTURAL")
                    .objectMeasurement("4.2 in depth")
                    .status(ComplaintStatus.IN_PROGRESS)
                    .citizen(citizen)
                    .department(roads)
                    .assignedTo(tech)
                    .aiSummary("High-risk road depression with potential axle damage on high-frequency transit artery. Rapid cold-mix patch required within 24 hours.")
                    .build();

            Complaint p2 = Complaint.builder()
                    .title("Pedestrian Signal Sync Failure")
                    .description("Signal timing is off at the 8th street transit stop, causing confusion for pedestrians.")
                    .category("TRAFFIC")
                    .locationName("Ward 4 • 8th St Transit Stop")
                    .latitude(40.7135)
                    .longitude(-74.008)
                    .severity(Severity.HIGH)
                    .severityScore(0.75)
                    .status(ComplaintStatus.ASSIGNED)
                    .citizen(citizen)
                    .department(roads)
                    .aiSummary("Signal timing failure posing risk to pedestrian safety during peak hours.")
                    .build();

            complaintRepository.saveAll(List.of(p1, p2));

            log.info("Demo data & 6 Knowledge Base Articles seeded successfully.");
            log.info("Citizen login:        citizen@demo.com / Password123");
            log.info("Staff (Admin) login:  admin@roads.gov  / Password123");
            log.info("Staff (Tech) login:   tech@roads.gov   / Password123");
        };
    }
}
