package com.city.complaints.domain.rag.controller;

import com.city.complaints.common.model.ApiResponse;
import com.city.complaints.domain.rag.dto.RagQueryRequest;
import com.city.complaints.domain.rag.dto.RagQueryResponse;
import com.city.complaints.domain.rag.entity.KnowledgeArticle;
import com.city.complaints.domain.rag.service.RagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for Citizen RAG AI Assistant & Knowledge Base.
 *
 * <p>Base path: {@code /rag}
 */
@RestController
@RequestMapping("/rag")
@RequiredArgsConstructor
public class RagController {

    private final RagService ragService;

    /**
     * POST /api/rag/ask — Ask the City AI Assistant.
     * Publicly accessible; if authenticated, personal complaint context is automatically fused.
     */
    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<RagQueryResponse>> askAssistant(
            @Valid @RequestBody RagQueryRequest request,
            Authentication authentication) {

        String callerSubject = authentication != null ? authentication.getName() : null;
        RagQueryResponse response = ragService.query(request, callerSubject);
        return ResponseEntity.ok(ApiResponse.ok("Query processed successfully", response));
    }

    /**
     * GET /api/rag/articles — Browse or search municipal knowledge articles by category.
     */
    @GetMapping("/articles")
    public ResponseEntity<ApiResponse<List<KnowledgeArticle>>> listArticles(
            @RequestParam(required = false) String category) {

        List<KnowledgeArticle> articles = ragService.listArticles(category);
        return ResponseEntity.ok(ApiResponse.ok("Articles retrieved successfully", articles));
    }
}
