package com.city.complaints.domain.dashboard.controller;

import com.city.complaints.common.model.ApiResponse;
import com.city.complaints.domain.complaint.dto.ComplaintResponse;
import com.city.complaints.domain.complaint.repository.ComplaintRepository;
import com.city.complaints.domain.dashboard.dto.PublicStatisticsResponse;
import com.city.complaints.domain.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Publicly accessible endpoints — no authentication required.
 * Compliant with Module E Open311 / OpenGov public transparency standards.
 * Base path: {@code /public}
 */
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final DashboardService  dashboardService;
    private final ComplaintRepository complaintRepository;

    /** GET /public/statistics — platform-wide statistics visible without login. */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<PublicStatisticsResponse>> publicStatistics() {
        return ResponseEntity.ok(ApiResponse.ok("Statistics retrieved",
                dashboardService.getPublicStatistics()));
    }

    /** GET /public/health — liveness check for deployment platforms. */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.ok("Service is healthy", "UP"));
    }

    /** GET /public/export/json — Open311 JSON raw dataset export. */
    @GetMapping(value = "/export/json", produces = MediaType.APPLICATION_JSON_VALUE)
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<ComplaintResponse>> exportJson() {
        List<ComplaintResponse> exportData = complaintRepository.findAll()
                .stream()
                .map(ComplaintResponse::fromPublic)
                .collect(Collectors.toList());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"civicpulse-open-data.json\"")
                .body(exportData);
    }

    /** GET /public/export/csv — OpenGov CSV dataset export. */
    @GetMapping(value = "/export/csv", produces = "text/csv")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<String> exportCsv() {
        List<ComplaintResponse> complaints = complaintRepository.findAll()
                .stream()
                .map(ComplaintResponse::fromPublic)
                .collect(Collectors.toList());

        StringBuilder csv = new StringBuilder();
        csv.append("id,title,category,severity,status,locationName,latitude,longitude,createdAt\n");

        for (ComplaintResponse c : complaints) {
            csv.append(escapeCsv(c.id())).append(",")
               .append(escapeCsv(c.title())).append(",")
               .append(escapeCsv(c.category())).append(",")
               .append(escapeCsv(c.severity() != null ? c.severity().name() : "")).append(",")
               .append(escapeCsv(c.status() != null ? c.status().name() : "")).append(",")
               .append(escapeCsv(c.locationName())).append(",")
               .append(c.latitude() != null ? c.latitude() : "").append(",")
               .append(c.longitude() != null ? c.longitude() : "").append(",")
               .append(escapeCsv(c.createdAt() != null ? c.createdAt().toString() : "")).append("\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"civicpulse-open-data.csv\"")
                .body(csv.toString());
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        String escaped = input.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
