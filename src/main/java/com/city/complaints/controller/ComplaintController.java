package com.city.complaints.controller;

import com.city.complaints.dto.request.AssignComplaintRequest;
import com.city.complaints.dto.request.CreateComplaintRequest;
import com.city.complaints.dto.request.FeedbackRequest;
import com.city.complaints.dto.request.UpdateStatusRequest;
import com.city.complaints.dto.response.ApiResponse;
import com.city.complaints.dto.response.ComplaintResponse;
import com.city.complaints.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Complaint CRUD and lifecycle endpoints.
 *
 * <p>Base path: {@code /complaints}
 */
@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    // ─── Create ───────────────────────────────────────────────────────────────

    /** POST /complaints — citizen creates a complaint (triggers AI scoring). */
    @PostMapping
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            Authentication authentication) {

        ComplaintResponse response =
                complaintService.createComplaint(request, authentication.getName());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Complaint created successfully", response));
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    /** GET /complaints — paginated list with optional filters. */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> listComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ComplaintResponse> data =
                complaintService.listComplaints(status, severity, category, page, size);

        return ResponseEntity.ok(ApiResponse.ok("Complaints retrieved", data));
    }

    /** GET /complaints/my — citizen's own complaints. */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> myComplaints(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ComplaintResponse> data =
                complaintService.getComplaintsByCitizen(authentication.getName(), page, size);

        return ResponseEntity.ok(ApiResponse.ok("Your complaints retrieved", data));
    }

    /** GET /complaints/:id — single complaint detail with status history. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Complaint retrieved",
                complaintService.getComplaintById(id)));
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    /** PATCH /complaints/:id/status — staff updates complaint status + optional AI reply. */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {

        ComplaintService.UpdateStatusResult result =
                complaintService.updateStatus(id, request, authentication.getName());

        Map<String, Object> data = result.suggestedReply() != null
                ? Map.of("complaint", result.complaint(), "suggestedReply", result.suggestedReply())
                : Map.of("complaint", result.complaint());

        return ResponseEntity.ok(ApiResponse.ok("Status updated", data));
    }

    /** PATCH /complaints/:id/assign — staff assigns complaint to a team member. */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<ComplaintResponse>> assignComplaint(
            @PathVariable String id,
            @Valid @RequestBody AssignComplaintRequest request,
            Authentication authentication) {

        ComplaintResponse response =
                complaintService.assignComplaint(id, request, authentication.getName());

        return ResponseEntity.ok(ApiResponse.ok("Complaint assigned successfully", response));
    }
}
