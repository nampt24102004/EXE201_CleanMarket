package com.app.features.feedback.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

public final class RefundControllerDto {
    private RefundControllerDto() { }
    public record RefundView(Long id, Long complaintId, String orderCode, BigDecimal amount, String status, String note, String providerRef,
        String customerName, String customerEmail, String bankName, String bankAccountNumber, String bankAccountHolder,
        Instant bankSubmittedAt, String bankReviewNote, Instant createdAt, Instant completedAt) { }
    public record CompletionRequest(@NotBlank(message = "Vui lòng nhập mã giao dịch chuyển khoản") String providerRef, String note) { }
    public record BankInfoRequest(
        @NotBlank(message = "Vui lòng nhập tên ngân hàng") @Size(max = 120) String bankName,
        @NotBlank @Pattern(regexp = "[0-9]{6,20}", message = "Số tài khoản chỉ gồm 6–20 chữ số") String accountNumber,
        @NotBlank(message = "Vui lòng nhập tên chủ tài khoản") @Size(max = 120) String accountHolder) { }
    public record ReviewRequest(@NotBlank(message = "Vui lòng nhập lý do") @Size(max = 500) String reason) { }
    public record EligiblePart(Long id, String supplierName, BigDecimal amount) { }
    /** A paid order the customer may still ask money back for, with the most that can be asked. */
    public record EligibleOrder(Long orderId, String orderCode, String orderStatus, Instant createdAt, BigDecimal paidAmount, BigDecimal refundable, java.util.List<EligiblePart> parts) { }
}
