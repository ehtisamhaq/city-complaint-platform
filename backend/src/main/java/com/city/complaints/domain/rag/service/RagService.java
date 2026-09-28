package com.city.complaints.domain.rag.service;

import com.city.complaints.domain.citizen.entity.Citizen;
import com.city.complaints.domain.citizen.repository.CitizenRepository;
import com.city.complaints.domain.complaint.entity.Complaint;
import com.city.complaints.domain.complaint.repository.ComplaintRepository;
import com.city.complaints.domain.department.entity.Department;
import com.city.complaints.domain.department.repository.DepartmentRepository;
import com.city.complaints.domain.rag.dto.RagQueryRequest;
import com.city.complaints.domain.rag.dto.RagQueryResponse;
import com.city.complaints.domain.rag.entity.KnowledgeArticle;
import com.city.complaints.domain.rag.repository.KnowledgeArticleRepository;
import com.city.complaints.infrastructure.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Retrieval-Augmented Generation (RAG) Service for Citizens.
 *
 * <p>Retrieves relevant municipal knowledge base articles, department service info,
 * and live complaint statuses to generate grounded, anti-hallucinatory AI responses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final KnowledgeArticleRepository knowledgeRepository;
    private final ComplaintRepository        complaintRepository;
    private final DepartmentRepository       departmentRepository;
    private final CitizenRepository          citizenRepository;
    private final AiService                  aiService;

    @Transactional(readOnly = true)
    public RagQueryResponse query(RagQueryRequest request, String callerSubject) {
        String question = request.question().trim();
        List<RagQueryResponse.SourceInfo> sources = new ArrayList<>();
        List<String> suggestedActions = new ArrayList<>();

        // 1. Retrieve relevant Knowledge Articles
        List<KnowledgeArticle> articles = retrieveKnowledgeArticles(question);
        for (KnowledgeArticle article : articles) {
            String excerpt = article.getContent().length() > 150
                    ? article.getContent().substring(0, 150) + "..."
                    : article.getContent();
            sources.add(new RagQueryResponse.SourceInfo(article.getTitle(), article.getCategory(), excerpt));
        }

        // 2. Retrieve Department directories
        List<Department> departments = departmentRepository.findAll();

        // 3. Retrieve Live Complaint Context (if authenticated or complaintId provided)
        List<Complaint> complaints = retrieveComplaints(request.complaintId(), callerSubject);
        boolean complaintIncluded = !complaints.isEmpty();

        for (Complaint c : complaints) {
            sources.add(new RagQueryResponse.SourceInfo(
                    "Complaint #" + c.getId().substring(0, Math.min(8, c.getId().length())) + " (" + c.getTitle() + ")",
                    c.getCategory(),
                    "Status: " + c.getStatus() + " | Severity: " + c.getSeverity()
            ));
        }

        // 4. Synthesize Grounded Context Window
        String contextText = buildContextString(articles, departments, complaints);

        // 5. Generate Response via Claude or Deterministic Fallback
        String answer;
        try {
            String systemPrompt = """
                    You are the City AI Municipal Assistant. Your job is to answer citizen questions accurately based ONLY on the provided City Knowledge Base, Department directories, and Complaint records.
                    
                    Instructions:
                    1. Ground every statement in the provided facts.
                    2. If the user asks about an issue or complaint, reference the exact status, department, and turnaround SLA.
                    3. If the answer is not in the knowledge base, state clearly that you don't have that specific record and provide the relevant department phone number/email.
                    4. Keep tone polite, professional, concise, and structured.
                    """;

            String userPrompt = """
                    === RELEVANT MUNICIPAL CONTEXT ===
                    %s
                    ==================================
                    
                    Citizen Question: "%s"
                    
                    Answer the citizen directly and concisely:
                    """.formatted(contextText, question);

            answer = aiService.askClaude(systemPrompt, userPrompt);
        } catch (Exception e) {
            log.warn("Claude RAG generation failed, using deterministic fallback. Error: {}", e.getMessage());
            answer = buildFallbackAnswer(question, articles, complaints, departments);
        }

        // 6. Suggest Next Actions
        populateSuggestedActions(suggestedActions, question, complaints);

        return new RagQueryResponse(answer, sources, suggestedActions, complaintIncluded);
    }

    @Transactional(readOnly = true)
    public List<KnowledgeArticle> listArticles(String category) {
        if (category != null && !category.isBlank()) {
            return knowledgeRepository.findByCategoryIgnoreCase(category);
        }
        return knowledgeRepository.findAll();
    }

    @Transactional
    public KnowledgeArticle createArticle(com.city.complaints.domain.rag.dto.CreateArticleRequest request) {
        KnowledgeArticle article = KnowledgeArticle.builder()
                .title(request.title().trim())
                .category(request.category().trim())
                .content(request.content().trim())
                .tags(request.tags() != null ? request.tags().trim() : null)
                .build();
        return knowledgeRepository.save(article);
    }

    // ─── Private Retrieval Helpers ────────────────────────────────────────────

    private List<KnowledgeArticle> retrieveKnowledgeArticles(String question) {
        // Extract keywords from question
        String[] words = question.toLowerCase().replaceAll("[^a-zA-Z0-9 ]", "").split("\\s+");
        Set<KnowledgeArticle> matching = new LinkedHashSet<>();

        for (String word : words) {
            if (word.length() >= 3 && !isStopWord(word)) {
                matching.addAll(knowledgeRepository.searchArticles(word));
            }
        }

        // If no specific match found, return top general articles
        if (matching.isEmpty()) {
            return knowledgeRepository.findAll().stream().limit(4).toList();
        }

        return matching.stream().limit(5).toList();
    }

    private List<Complaint> retrieveComplaints(String complaintId, String callerSubject) {
        List<Complaint> complaints = new ArrayList<>();

        if (complaintId != null && !complaintId.isBlank()) {
            complaintRepository.findById(complaintId.trim()).ifPresent(complaints::add);
        }

        if (callerSubject != null && callerSubject.startsWith("CITIZEN:")) {
            String email = callerSubject.substring("CITIZEN:".length());
            Optional<Citizen> citizen = citizenRepository.findByEmail(email);
            if (citizen.isPresent()) {
                var citizenComplaints = complaintRepository
                        .findTop5ByCitizenIdOrderByCreatedAtDesc(citizen.get().getId());
                for (Complaint c : citizenComplaints) {
                    if (!complaints.contains(c)) {
                        complaints.add(c);
                    }
                }
            }
        }

        return complaints;
    }

    private String buildContextString(
            List<KnowledgeArticle> articles,
            List<Department> departments,
            List<Complaint> complaints) {

        StringBuilder sb = new StringBuilder();

        if (!articles.isEmpty()) {
            sb.append("### MUNICIPAL GUIDELINES & SLAS:\n");
            for (KnowledgeArticle a : articles) {
                sb.append("- [").append(a.getCategory()).append("] ").append(a.getTitle()).append(":\n  ")
                        .append(a.getContent()).append("\n\n");
            }
        }

        if (!departments.isEmpty()) {
            sb.append("### CITY DEPARTMENTS:\n");
            for (Department d : departments) {
                sb.append("- ").append(d.getName()).append(" | Phone: ").append(d.getPhone())
                        .append(" | Email: ").append(d.getEmail())
                        .append(" | Office: ").append(d.getLocation()).append("\n");
            }
            sb.append("\n");
        }

        if (!complaints.isEmpty()) {
            sb.append("### CITIZEN'S COMPLAINT RECORDS:\n");
            for (Complaint c : complaints) {
                sb.append("- Complaint ID: ").append(c.getId())
                        .append(" | Title: ").append(c.getTitle())
                        .append(" | Status: ").append(c.getStatus())
                        .append(" | Severity: ").append(c.getSeverity())
                        .append(" | Category: ").append(c.getCategory())
                        .append(" | Created: ").append(c.getCreatedAt())
                        .append("\n  Resolution: ").append(c.getResolutionNotes() != null ? c.getResolutionNotes() : "Pending investigation")
                        .append("\n");
            }
        }

        return sb.toString();
    }

    private String buildFallbackAnswer(
            String question,
            List<KnowledgeArticle> articles,
            List<Complaint> complaints,
            List<Department> departments) {

        StringBuilder sb = new StringBuilder();
        if (!complaints.isEmpty()) {
            Complaint latest = complaints.get(0);
            sb.append("Regarding your complaint \"").append(latest.getTitle())
                    .append("\", its current status is **").append(latest.getStatus())
                    .append("** (Severity: ").append(latest.getSeverity()).append("). ");
            if (latest.getResolutionNotes() != null) {
                sb.append("Notes: ").append(latest.getResolutionNotes()).append(". ");
            }
        }

        if (!articles.isEmpty()) {
            KnowledgeArticle top = articles.get(0);
            sb.append("\n\n**").append(top.getTitle()).append("**:\n").append(top.getContent());
        } else {
            sb.append("\n\nFor municipal services, please contact City Hall or the relevant department.");
        }

        return sb.toString();
    }

    private void populateSuggestedActions(List<String> actions, String question, List<Complaint> complaints) {
        String lower = question.toLowerCase();
        if (lower.contains("pothole") || lower.contains("broken") || lower.contains("leak") || lower.contains("file") || lower.contains("report")) {
            actions.add("File a New Complaint");
        }
        if (!complaints.isEmpty()) {
            actions.add("View My Complaints Tracker");
        }
        actions.add("Contact City Hall Helpdesk");
    }

    private boolean isStopWord(String word) {
        return Set.of("the", "and", "for", "with", "what", "how", "when", "where", "who", "why", "are", "you", "can", "tell", "about", "this", "that", "have", "from").contains(word);
    }
}
