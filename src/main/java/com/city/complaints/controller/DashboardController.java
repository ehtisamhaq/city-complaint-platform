package com.city.complaints.controller;

import com.city.complaints.dto.response.ApiResponse;
import com.city.complaints.dto.response.CitizenDashboardResponse;
import com.city.complaints.dto.response.StaffDashboardResponse;
import com.city.complaints.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Dashboard endpoints (authenticated).
 *
 * <p>Base path: {@code /dashboard}
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /** GET /dashboard/citizen — stats and recent complaints for the logged-in citizen. */
    @GetMapping("/citizen")
    public ResponseEntity<ApiResponse<CitizenDashboardResponse>> citizenDashboard(
            Authentication authentication) {

        return ResponseEntity.ok(ApiResponse.ok("Dashboard data retrieved",
                dashboardService.getCitizenDashboard(authentication.getName())));
    }

    /** GET /dashboard/staff — stats and assigned complaints for the logged-in staff member. */
    @GetMapping("/staff")
    public ResponseEntity<ApiResponse<StaffDashboardResponse>> staffDashboard(
            Authentication authentication) {

        return ResponseEntity.ok(ApiResponse.ok("Dashboard data retrieved",
                dashboardService.getStaffDashboard(authentication.getName())));
    }
}
