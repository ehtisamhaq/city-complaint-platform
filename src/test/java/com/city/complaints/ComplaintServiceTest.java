package com.city.complaints;

import com.city.complaints.dto.request.CreateComplaintRequest;
import com.city.complaints.dto.request.UpdateStatusRequest;
import com.city.complaints.dto.response.ComplaintResponse;
import com.city.complaints.entity.*;
import com.city.complaints.exception.ResourceNotFoundException;
import com.city.complaints.repository.*;
import com.city.complaints.service.AiService;
import com.city.complaints.service.ComplaintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private CitizenRepository citizenRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private StatusHistoryRepository statusHistoryRepository;

    @Mock
    private AiService aiService;

    @InjectMocks
    private ComplaintService complaintService;

    private Citizen mockCitizen;

    @BeforeEach
    void setUp() {
        mockCitizen = Citizen.builder()
                .id("citizen-uuid-1")
                .email("citizen@demo.com")
                .fullName("John Citizen")
                .build();
    }

    @Test
    @DisplayName("Create Complaint - Success with AI triage")
    void createComplaint_Success_WithAiTriage() {
        CreateComplaintRequest request = new CreateComplaintRequest(
                "Big pothole on Main St",
                "Deep pothole near junction causing traffic",
                "Roads & Infrastructure",
                "Main St 4th Ave",
                40.7128,
                -74.0060,
                null
        );

        when(citizenRepository.findByEmail("citizen@demo.com")).thenReturn(Optional.of(mockCitizen));
        when(aiService.scoreComplaintSeverity(anyString(), anyString()))
                .thenReturn(new AiService.SeverityResult("HIGH", "Hazard to vehicles"));

        Complaint savedComplaint = Complaint.builder()
                .id("complaint-uuid-100")
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .locationName(request.locationName())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .status(ComplaintStatus.PENDING)
                .severity(Severity.HIGH)
                .aiSummary("Hazard to vehicles")
                .citizen(mockCitizen)
                .createdAt(LocalDateTime.now())
                .build();

        when(complaintRepository.save(any(Complaint.class))).thenReturn(savedComplaint);

        ComplaintResponse response = complaintService.createComplaint(request, "CITIZEN:citizen@demo.com");

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo("complaint-uuid-100");
        assertThat(response.severity()).isEqualTo(Severity.HIGH);
        assertThat(response.status()).isEqualTo(ComplaintStatus.PENDING);
        verify(statusHistoryRepository, times(1)).save(any(StatusHistory.class));
    }

    @Test
    @DisplayName("Create Complaint - Citizen not found throws ResourceNotFoundException")
    void createComplaint_CitizenNotFound_ThrowsException() {
        CreateComplaintRequest request = new CreateComplaintRequest(
                "Title", "Description", "Category", "Location", null, null, null
        );

        when(citizenRepository.findByEmail("unknown@demo.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.createComplaint(request, "CITIZEN:unknown@demo.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update Status - Success")
    void updateStatus_Success() {
        Complaint complaint = Complaint.builder()
                .id("complaint-uuid-100")
                .title("Street light broken")
                .severity(Severity.MEDIUM)
                .category("Electricity")
                .description("Lamp post out")
                .status(ComplaintStatus.PENDING)
                .citizen(mockCitizen)
                .build();

        UpdateStatusRequest updateRequest = new UpdateStatusRequest("IN_PROGRESS", "Assigned technician on site", false);

        when(complaintRepository.findById("complaint-uuid-100")).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenReturn(complaint);

        ComplaintService.UpdateStatusResult result = complaintService.updateStatus("complaint-uuid-100", updateRequest, "STAFF:admin@city.gov");

        assertThat(result.complaint().status()).isEqualTo(ComplaintStatus.IN_PROGRESS);
        verify(statusHistoryRepository, times(1)).save(any(StatusHistory.class));
    }
}
