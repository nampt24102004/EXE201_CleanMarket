package com.app.features.admin.controller;

import com.app.common.ApiResponse;
import com.app.features.admin.dto.AdminControllerDto.*;
import com.app.features.admin.service.AdminReportService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin")
public class AdminReportController {
    private final AdminReportService reports;
    public AdminReportController(AdminReportService reports) { this.reports = reports; }

    @GetMapping("/dashboard/summary") public ApiResponse<DashboardSummary> summary() { return ApiResponse.ok(reports.summary()); }

    @GetMapping("/reports/revenue")
    public ApiResponse<List<RevenuePoint>> revenue(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(defaultValue = "day") String groupBy) {
        return ApiResponse.ok(reports.revenue(from, to, groupBy));
    }

    @GetMapping("/reports/top-products")
    public ApiResponse<List<TopProduct>> topProducts(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(required = false) Integer limit) {
        return ApiResponse.ok(reports.topProducts(from, to, limit));
    }

    @GetMapping("/reports/top-suppliers")
    public ApiResponse<List<TopSupplier>> topSuppliers(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(required = false) Integer limit) {
        return ApiResponse.ok(reports.topSuppliers(from, to, limit));
    }
}
