package com.city.complaints.domain.dashboard.controller;

import com.city.complaints.common.model.ApiResponse;
import com.city.complaints.domain.dashboard.dto.PublicStatisticsResponse;
import com.city.complaints.domain.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publicly accessible endpoints — no authentication required.
 *
 * <p>Base path: {@code /public}
 */
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final DashboardService dashboardService;

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
}
