package com.city.complaints;

import com.city.complaints.domain.citizen.repository.CitizenRepository;
import com.city.complaints.domain.complaint.entity.ComplaintStatus;
import com.city.complaints.domain.complaint.repository.ComplaintRepository;
import com.city.complaints.domain.dashboard.dto.PublicStatisticsResponse;
import com.city.complaints.domain.dashboard.service.DashboardService;
import com.city.complaints.domain.staff.repository.StaffRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private CitizenRepository citizenRepository;

    @Mock
    private StaffRepository staffRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("Get Public Statistics - Success")
    void getPublicStatistics_Success() {
        when(complaintRepository.count()).thenReturn(10L);
        when(complaintRepository.countByStatus(ComplaintStatus.RESOLVED)).thenReturn(4L);
        when(complaintRepository.countByStatus(ComplaintStatus.PENDING)).thenReturn(3L);
        when(complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS)).thenReturn(3L);

        List<Object[]> categoryRows = Collections.singletonList(new Object[]{"Roads", 5L});
        when(complaintRepository.countGroupedByCategory()).thenReturn(categoryRows);

        List<Object[]> deptRows = Collections.singletonList(new Object[]{"Roads & Highways", 5L, 2L});
        when(complaintRepository.countGroupedByDepartment()).thenReturn(deptRows);

        PublicStatisticsResponse response = dashboardService.getPublicStatistics();

        assertThat(response).isNotNull();
        assertThat(response.stats().totalComplaints()).isEqualTo(10L);
        assertThat(response.stats().resolved()).isEqualTo(4L);
        assertThat(response.byCategory()).containsEntry("Roads", 5L);
        assertThat(response.byDepartment()).hasSize(1);
        assertThat(response.byDepartment().get(0).name()).isEqualTo("Roads & Highways");
    }
}
