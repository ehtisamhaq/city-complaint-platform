package com.city.complaints.domain.complaint.service;

import com.city.complaints.common.exception.ConflictException;
import com.city.complaints.common.exception.ForbiddenException;
import com.city.complaints.common.exception.ResourceNotFoundException;
import com.city.complaints.domain.citizen.entity.Citizen;
import com.city.complaints.domain.citizen.repository.CitizenRepository;
import com.city.complaints.domain.department.repository.DepartmentRepository;
import com.city.complaints.domain.feedback.dto.FeedbackRequest;
import com.city.complaints.domain.feedback.entity.Feedback;
import com.city.complaints.domain.feedback.repository.FeedbackRepository;
import com.city.complaints.domain.staff.entity.Staff;
import com.city.complaints.domain.staff.repository.StaffRepository;
import com.city.complaints.domain.complaint.dto.AssignComplaintRequest;
import com.city.complaints.domain.complaint.dto.ComplaintResponse;
import com.city.complaints.domain.complaint.dto.CreateComplaintRequest;
import com.city.complaints.domain.complaint.dto.UpdateStatusRequest;
import com.city.complaints.domain.complaint.entity.Complaint;
import com.city.complaints.domain.complaint.entity.ComplaintStatus;
import com.city.complaints.domain.complaint.entity.Severity;
import com.city.complaints.domain.complaint.entity.StatusHistory;
import com.city.complaints.domain.complaint.repository.ComplaintRepository;
import com.city.complaints.domain.complaint.repository.StatusHistoryRepository;
import com.city.complaints.infrastructure.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Core business logic for complaint lifecycle management.
 *
 * <p>AI scoring happens inside {@link #createComplaint} — if the AI call fails,
 * we fall back to severity MEDIUM and still persist the complaint (never block the user).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository       complaintRepository;
    private final CitizenRepository         citizenRepository;
    private final StaffRepository           staffRepository;
    private final DepartmentRepository      departmentRepository;
    private final FeedbackRepository        feedbackRepository;
    private final StatusHistoryRepository   statusHistoryRepository;
    private final AiService                 aiService;

    // ─── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse createComplaint(CreateComplaintRequest request, String citizenEmail) {
        Citizen citizen = findCitizenByEmail(citizenEmail);

        // AI severity scoring — fails gracefully
        AiService.SeverityResult severityResult =
                aiService.scoreComplaintSeverity(request.description(), request.category());

        Severity severity = parseSeverity(severityResult.severity());

        Complaint complaint = Complaint.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .locationName(request.locationName())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .photoUrl(request.photoUrl())
                .severity(severity)
                .severityScore(severityResult.score())
                .objectType(severityResult.objectType())
                .objectMeasurement(severityResult.objectMeasurement())
                .aiSummary(severityResult.reason())
                .citizen(citizen)
                .status(ComplaintStatus.PENDING)
                .build();

        complaint = complaintRepository.save(complaint);

        // Record initial status in history
        recordStatusHistory(complaint, ComplaintStatus.PENDING, "Complaint submitted", citizenEmail);

        log.info("Complaint created [id={}] [severity={}]", complaint.getId(), severity);
        return ComplaintResponse.from(complaint);
    }

    // ─── Read (paginated, filterable) ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ComplaintResponse> listComplaints(
            String status, String severity, String category, int page, int size) {
        return listComplaints(status, severity, category, page, size, false);
    }

    /**
     * @param publicView when true, project through
     *                   {@link ComplaintResponse#fromPublic} so contact details
     *                   are withheld from anonymous callers
     */
    @Transactional(readOnly = true)
    public Page<ComplaintResponse> listComplaints(
            String status, String severity, String category, int page, int size, boolean publicView) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        ComplaintStatus statusEnum   = status   != null ? ComplaintStatus.valueOf(status.toUpperCase())   : null;
        Severity        severityEnum = severity != null ? Severity.valueOf(severity.toUpperCase())         : null;

        return complaintRepository
                .findWithFilters(statusEnum, severityEnum, category, pageable)
                .map(publicView ? ComplaintResponse::fromPublic : ComplaintResponse::from);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(String id) {
        return getComplaintById(id, false);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(String id, boolean publicView) {
        return publicView
                ? ComplaintResponse.fromPublic(findComplaintById(id))
                : ComplaintResponse.from(findComplaintById(id));
    }

    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getComplaintsByCitizen(String citizenEmail, int page, int size) {
        Citizen citizen  = findCitizenByEmail(citizenEmail);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return complaintRepository.findByCitizenId(citizen.getId(), pageable)
                .map(ComplaintResponse::from);
    }

    // ─── Update status ────────────────────────────────────────────────────────

    @Transactional
    public UpdateStatusResult updateStatus(
            String id, UpdateStatusRequest request, String staffEmail) {

        Complaint complaint = findComplaintById(id);
        ComplaintStatus newStatus = ComplaintStatus.valueOf(request.status().toUpperCase());

        complaint.setStatus(newStatus);

        if (newStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
            complaint.setResolutionNotes(request.note());
        }

        complaintRepository.save(complaint);
        recordStatusHistory(complaint, newStatus, request.note(), staffEmail);

        String suggestedReply = null;
        if (request.includeAiReply()) {
            suggestedReply = aiService.generateReplyTemplate(
                    complaint.getCategory(),
                    complaint.getSeverity().name(),
                    complaint.getDescription());
        }

        log.info("Complaint [id={}] status updated to {} by {}", id, newStatus, staffEmail);
        return new UpdateStatusResult(ComplaintResponse.from(complaint), suggestedReply);
    }

    // ─── Assign ───────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse assignComplaint(
            String id, AssignComplaintRequest request, String staffEmail) {

        Complaint complaint = findComplaintById(id);
        Staff     staff     = staffRepository.findById(request.assignedToId())
                .or(() -> staffRepository.findByEmail(request.assignedToId()))
                .orElseThrow(() -> new ResourceNotFoundException("Staff", request.assignedToId()));

        complaint.setAssignedTo(staff);
        complaint.setDepartment(staff.getDepartment());
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaintRepository.save(complaint);

        recordStatusHistory(complaint, ComplaintStatus.ASSIGNED,
                "Assigned to " + staff.getFullName(), staffEmail);

        log.info("Complaint [id={}] assigned to staff [{}]", id, staff.getEmail());
        return ComplaintResponse.from(complaint);
    }

    // ─── Feedback ─────────────────────────────────────────────────────────────

    @Transactional
    public void submitFeedback(String complaintId, FeedbackRequest request, String citizenEmail) {
        Complaint complaint = findComplaintById(complaintId);
        Citizen   citizen   = findCitizenByEmail(citizenEmail);

        // Only the complaint owner can submit feedback
        if (!complaint.getCitizen().getId().equals(citizen.getId())) {
            throw new ForbiddenException("You can only submit feedback for your own complaints");
        }

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new ConflictException("Feedback can only be submitted after complaint is resolved");
        }

        if (feedbackRepository.existsByComplaintId(complaintId)) {
            throw new ConflictException("Feedback already submitted for this complaint");
        }

        Feedback feedback = Feedback.builder()
                .rating(request.rating())
                .comment(request.comment())
                .complaint(complaint)
                .citizen(citizen)
                .build();

        feedbackRepository.save(feedback);
        log.info("Feedback submitted for complaint [id={}] rating={}", complaintId, request.rating());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Complaint findComplaintById(String id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));
    }

    private Citizen findCitizenByEmail(String email) {
        // Remove prefix if present
        String cleanEmail = email.startsWith("CITIZEN:") ? email.substring(8) : email;
        return citizenRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found: " + cleanEmail));
    }

    private void recordStatusHistory(Complaint complaint, ComplaintStatus status,
                                     String note, String changedBy) {
        StatusHistory history = StatusHistory.builder()
                .complaint(complaint)
                .status(status)
                .note(note)
                .changedBy(changedBy)
                .build();
        statusHistoryRepository.save(history);
    }

    private Severity parseSeverity(String raw) {
        try {
            return Severity.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown severity '{}' from AI, defaulting to MEDIUM", raw);
            return Severity.MEDIUM;
        }
    }

    // ─── Inner result type ────────────────────────────────────────────────────

    public record UpdateStatusResult(ComplaintResponse complaint, String suggestedReply) {}
}
