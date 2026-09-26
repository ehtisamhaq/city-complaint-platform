package com.city.complaints;

import com.city.complaints.domain.citizen.entity.Citizen;
import com.city.complaints.domain.citizen.repository.CitizenRepository;
import com.city.complaints.domain.complaint.entity.Complaint;
import com.city.complaints.domain.complaint.entity.ComplaintStatus;
import com.city.complaints.domain.complaint.entity.Severity;
import com.city.complaints.domain.complaint.repository.ComplaintRepository;
import com.city.complaints.domain.department.repository.DepartmentRepository;
import com.city.complaints.domain.rag.dto.RagQueryRequest;
import com.city.complaints.domain.rag.dto.RagQueryResponse;
import com.city.complaints.domain.rag.entity.KnowledgeArticle;
import com.city.complaints.domain.rag.repository.KnowledgeArticleRepository;
import com.city.complaints.domain.rag.service.RagService;
import com.city.complaints.infrastructure.ai.AiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RagServiceTest {

    @Mock
    private KnowledgeArticleRepository knowledgeRepository;

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private CitizenRepository citizenRepository;

    @Mock
    private AiService aiService;

    @InjectMocks
    private RagService ragService;

    private KnowledgeArticle potholeArticle;
    private Citizen mockCitizen;
    private Complaint mockComplaint;

    @BeforeEach
    void setUp() {
        potholeArticle = KnowledgeArticle.builder()
                .id("article-1")
                .title("Pothole & Road SLAs")
                .category("Roads & Highways")
                .tags("pothole,road,repair")
                .content("CRITICAL potholes are resolved in 24 hours. Regular repairs take 3-5 days.")
                .build();

        mockCitizen = Citizen.builder()
                .id("citizen-1")
                .email("citizen@demo.com")
                .fullName("John Citizen")
                .build();

        mockComplaint = Complaint.builder()
                .id("complaint-100")
                .title("Pothole on 5th Ave")
                .status(ComplaintStatus.PENDING)
                .severity(Severity.HIGH)
                .category("Roads & Highways")
                .citizen(mockCitizen)
                .build();
    }

    @Test
    @DisplayName("RAG Query - Municipal Knowledge Retrieval & Grounded Answer")
    void ragQuery_KnowledgeRetrieval_Success() {
        RagQueryRequest request = new RagQueryRequest("How long does it take to fix a pothole?", null);

        when(knowledgeRepository.searchArticles(anyString())).thenReturn(List.of(potholeArticle));
        when(departmentRepository.findAll()).thenReturn(List.of());
        when(aiService.askClaude(anyString(), anyString())).thenReturn("Potholes are repaired within 24 hours for critical issues and 3-5 business days for standard repairs.");

        RagQueryResponse response = ragService.query(request, null);

        assertThat(response).isNotNull();
        assertThat(response.answer()).contains("24 hours");
        assertThat(response.sources()).isNotEmpty();
        assertThat(response.sources().get(0).title()).isEqualTo("Pothole & Road SLAs");
        assertThat(response.isComplaintContextIncluded()).isFalse();
    }

    @Test
    @DisplayName("RAG Query - Fuses Citizen Complaint Context when Authenticated")
    void ragQuery_WithAuthenticatedCitizen_FusesComplaintContext() {
        RagQueryRequest request = new RagQueryRequest("What is the status of my road complaint?", null);

        when(knowledgeRepository.searchArticles(anyString())).thenReturn(List.of(potholeArticle));
        when(citizenRepository.findByEmail("citizen@demo.com")).thenReturn(Optional.of(mockCitizen));
        when(complaintRepository.findTop5ByCitizenIdOrderByCreatedAtDesc("citizen-1")).thenReturn(List.of(mockComplaint));
        when(departmentRepository.findAll()).thenReturn(List.of());
        when(aiService.askClaude(anyString(), anyString())).thenReturn("Your complaint #complaint-100 regarding 'Pothole on 5th Ave' is currently PENDING.");

        RagQueryResponse response = ragService.query(request, "CITIZEN:citizen@demo.com");

        assertThat(response).isNotNull();
        assertThat(response.answer()).contains("PENDING");
        assertThat(response.isComplaintContextIncluded()).isTrue();
        assertThat(response.sources().stream().anyMatch(s -> s.title().contains("Pothole on 5th Ave"))).isTrue();
    }

    @Test
    @DisplayName("List Knowledge Articles by Category")
    void listArticles_ByCategory_Success() {
        when(knowledgeRepository.findByCategoryIgnoreCase("Roads & Highways"))
                .thenReturn(List.of(potholeArticle));

        List<KnowledgeArticle> articles = ragService.listArticles("Roads & Highways");

        assertThat(articles).hasSize(1);
        assertThat(articles.get(0).getCategory()).isEqualTo("Roads & Highways");
    }
}
