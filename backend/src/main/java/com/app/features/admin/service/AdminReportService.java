package com.app.features.admin.service;

import com.app.features.admin.dto.AdminControllerDto.*;
import java.time.LocalDate;
import java.util.List;

public interface AdminReportService {
    DashboardSummary summary();
    List<RevenuePoint> revenue(LocalDate from, LocalDate to, String groupBy);
    List<TopProduct> topProducts(LocalDate from, LocalDate to, Integer limit);
    List<TopSupplier> topSuppliers(LocalDate from, LocalDate to, Integer limit);
}
