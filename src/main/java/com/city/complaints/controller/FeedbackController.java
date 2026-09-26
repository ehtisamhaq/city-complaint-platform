package com.city.complaints.controller;

import com.city.complaints.dto.request.FeedbackRequest;
import com.city.complaints.dto.response.ApiResponse;
import com.city.complaints.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Feedback submission endpoint.
 *
 * <p>Base path: {@code /feedback}
 */
@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final ComplaintService complaintService;

    /** POST /feedback/{complaintId} — citizen submits feedback for a resolved complaint. */
    @PostMapping("/{complaintId}")
    public ResponseEntity<ApiResponse<Void>> submitFeedback(
            @PathVariable String complaintId,
            @Valid @RequestBody FeedbackRequest request,
            Authentication authentication) {

        complaintService.submitFeedback(complaintId, request, authentication.getName());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Feedback submitted successfully"));
    }
}
