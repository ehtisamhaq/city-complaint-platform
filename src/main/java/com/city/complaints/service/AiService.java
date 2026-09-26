package com.city.complaints.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Calls the Anthropic Claude REST API directly via Spring WebClient.
 *
 * <p><b>Why not the Anthropic Java SDK?</b><br>
 * The {@code com.anthropic:anthropic-java} artifact is NOT published to Maven Central.
 * Using WebClient against the documented REST API is the correct, dependency-free approach
 * and is fully equivalent in functionality.
 *
 * <p>All AI calls use a 10-second timeout and fall back gracefully on any failure so
 * complaint creation never blocks indefinitely.
 */
@Service
@Slf4j
public class AiService {

    private static final Duration AI_TIMEOUT = Duration.ofSeconds(10);

    private final WebClient    webClient;
    private final ObjectMapper objectMapper;

    @Value("${anthropic.model}")
    private String model;

    @Value("${anthropic.max-tokens}")
    private int maxTokens;

    public AiService(
            @Value("${anthropic.api-key}") String apiKey,
            @Value("${anthropic.base-url}") String baseUrl
    ) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .build();
        this.objectMapper = new ObjectMapper();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Calls Claude to assess the severity of a complaint.
     *
     * @return a {@link SeverityResult} with severity and reason; falls back to MEDIUM on failure.
     */
    public SeverityResult scoreComplaintSeverity(String description, String category) {
        String prompt = """
                You are a city complaint severity assessor. Analyze this complaint and rate its urgency.

                Category: %s
                Description: "%s"

                Consider:
                - Public safety risk (CRITICAL: severe injury/death risk)
                - Number of people affected (HIGH: many people, MEDIUM: moderate, LOW: few)
                - Financial impact

                Respond ONLY with valid JSON (no markdown):
                {
                  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                  "reason": "Brief reason (max 80 characters)"
                }
                """.formatted(category, description);

        try {
            String raw = callClaude(prompt);
            return parseJson(raw, SeverityResult.class);
        } catch (Exception e) {
            log.warn("AI severity scoring failed, using default MEDIUM. Reason: {}", e.getMessage());
            return new SeverityResult("MEDIUM", "AI assessment unavailable");
        }
    }

    /**
     * Generates a professional reply template for a status update notification.
     *
     * @return a reply string; falls back to a generic message on failure.
     */
    public String generateReplyTemplate(String category, String severity, String description) {
        String prompt = """
                Generate a professional, empathetic reply from a city department to a citizen complaint. Keep it under 100 words.

                Category: %s
                Severity: %s
                Issue: "%s"

                Requirements:
                - Acknowledge the issue
                - Provide expected resolution time (CRITICAL: 24h, HIGH: 48h, MEDIUM: 3-5 days, LOW: 1-2 weeks)
                - Be professional and reassuring

                Respond with ONLY the message body, no subject line, no signature.
                """.formatted(category, severity, description);

        try {
            return callClaude(prompt);
        } catch (Exception e) {
            log.warn("Reply template generation failed: {}", e.getMessage());
            return "Thank you for your complaint. We have received your report and will investigate promptly.";
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Sends a message to the Claude Messages API and returns the first text block.
     */
    @SuppressWarnings("unchecked")
    private String callClaude(String userMessage) {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "messages", List.of(
                        Map.of("role", "user", "content", userMessage)
                )
        );

        Map<String, Object> response = webClient.post()
                .uri("/v1/messages")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(AI_TIMEOUT)
                .block();

        if (response == null) {
            throw new IllegalStateException("Empty response from Claude API");
        }

        // Extract first content block's text
        List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
        if (content == null || content.isEmpty()) {
            throw new IllegalStateException("No content in Claude response");
        }
        return (String) content.get(0).get("text");
    }

    /**
     * Parses a JSON string into the given type, stripping markdown fences if present.
     */
    private <T> T parseJson(String raw, Class<T> type) {
        try {
            String cleaned = raw.replace("```json", "").replace("```", "").strip();
            return objectMapper.readValue(cleaned, type);
        } catch (Exception e) {
            log.error("JSON parse error for: {}", raw, e);
            throw new IllegalStateException("Could not parse AI response JSON", e);
        }
    }

    // ─── Response record ──────────────────────────────────────────────────────

    /** Parsed result of the severity scoring call. */
    public record SeverityResult(String severity, String reason) {}
}
