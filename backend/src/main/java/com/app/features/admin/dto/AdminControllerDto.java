package com.app.features.admin.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

public final class AdminControllerDto {
    private AdminControllerDto() { }
    /** enabled keeps its old meaning for the UI toggle: true when the account is not locked by an admin. */
    public record UserView(Long id, String email, String fullName, String phone, String role, List<String> roles, boolean enabled, boolean verified, boolean locked, Instant createdAt) { }
    public record SupplierSummary(Long id, String name, String status) { }
    public record UserDetail(UserView user, long orderCount, BigDecimal totalSpent, long complaintCount, SupplierSummary supplier) { }
    public record UserStatusRequest(boolean enabled) { }
    public record RoleRequest(@NotBlank String role) { }
    public record CreateStaffRequest(
        @NotBlank @Email(message = "Email không hợp lệ") String email,
        @NotBlank(message = "Vui lòng nhập họ tên") String fullName,
        @NotBlank @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 ký tự") String password,
        @NotBlank String role,
        @Pattern(regexp = "^$|0[0-9]{9}", message = "Số điện thoại phải gồm 10 chữ số") String phone) { }
    public record CategoryRequest(@NotBlank String name) { }
    public record CategoryView(Long id, String name, boolean active) { }
    public record AuditView(Long id, String actorEmail, String action, String entityType, Long entityId, String detail, Instant createdAt) { }
    public record SettingView(String key, String value, String description, Instant updatedAt) { }
    public record SettingRequest(@NotNull @Size(max = 4000) String value, @Size(max = 500) String description) { }

    public record DashboardSummary(
        BigDecimal paidRevenue, BigDecimal refundedAmount, BigDecimal netRevenue, BigDecimal grossMerchandiseValue,
        Map<String, Long> ordersByStatus, long totalUsers, long newUsersLast30Days, long lockedUsers,
        long pendingSuppliers, long pendingProducts, long pendingComplaints, long requestedRefunds, long stalePendingPayments) { }
    public record RevenuePoint(LocalDate periodStart, BigDecimal paidRevenue, long paidOrders) { }
    public record TopProduct(Long productId, String productName, String supplierName, BigDecimal quantity, BigDecimal revenue, long orderCount) { }
    public record TopSupplier(Long supplierId, String supplierName, BigDecimal revenue, long orderCount) { }
    public record PaymentView(Long id, Long orderId, String orderCode, String customerEmail, String provider, String status, BigDecimal amount,
        String providerTransactionNo, Instant createdAt, Instant paidAt, Instant expiresAt, boolean stale) { }
}
