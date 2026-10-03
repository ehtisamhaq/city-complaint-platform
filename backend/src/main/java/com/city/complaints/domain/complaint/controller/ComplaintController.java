package com.city.complaints.domain.complaint.controller;

import com.city.complaints.common.exception.ApiException;
import com.city.complaints.common.model.ApiResponse;
import com.city.complaints.domain.complaint.dto.AssignComplaintRequest;
import com.city.complaints.domain.complaint.dto.ComplaintResponse;
import com.city.complaints.domain.complaint.dto.CreateComplaintRequest;
import com.city.complaints.domain.complaint.dto.UpdateStatusRequest;
import com.city.complaints.domain.complaint.service.ComplaintService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Complaint CRUD and lifecycle endpoints.
 *
 * <p>Base path: {@code /complaints}
 */
@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@Slf4j
public class ComplaintController {

    private final ComplaintService complaintService;
    private final Cloudinary cloudinary;

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

    /** POST /complaints/upload — upload image to Cloudinary and return secure URL. */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        if (file.isEmpty()) {
            throw new ApiException(400, "File is empty");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "nagar_civic")
            );

            String url = (String) uploadResult.get("secure_url");
            if (url == null) {
                url = (String) uploadResult.get("url");
            }

            log.info("Image uploaded to Cloudinary [url={}] [user={}]", url, authentication.getName());
            return ResponseEntity.ok(ApiResponse.ok("Image uploaded successfully", Map.of("url", url)));
        } catch (Exception e) {
            log.error("Cloudinary upload failed", e);
            throw new ApiException(500, "Failed to upload image: " + e.getMessage());
        }
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    /** GET /complaints — paginated list with optional filters. Public. */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> listComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ComplaintResponse> data = complaintService.listComplaints(
                status, severity, category, page, size, isAnonymous());

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

    /** GET /complaints/:id — single complaint detail with status history. Public. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Complaint retrieved",
                complaintService.getComplaintById(id, isAnonymous())));
    }

    /**
     * The two read endpoints above are {@code permitAll}, so an anonymous
     * request still reaches them. Those callers get a projection without the
     * complainant's or assignee's email address; staff keep the full view.
     */
    private static boolean isAnonymous() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken;
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

    // ─── Endorsements ─────────────────────────────────────────────────────────

    /**
     * POST /complaints/{id}/endorse — public "Endorse this fix".
     *
     * <p>Anonymous by design: the public board is where endorsements come from,
     * and requiring an account would defeat the purpose. Returns the new total
     * so the client can settle the number without refetching the list.
     */
    @PostMapping("/{id}/endorse")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> endorse(
            @PathVariable String id) {

        int total = complaintService.endorse(id);
        return ResponseEntity.ok(
                ApiResponse.ok("Endorsement recorded", Map.of("endorseCount", total)));
    }
}
