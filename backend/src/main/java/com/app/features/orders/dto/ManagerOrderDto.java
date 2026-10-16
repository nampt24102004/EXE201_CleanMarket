package com.app.features.orders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ManagerOrderDto {
    private ManagerOrderDto() { }
    public record PaymentLine(Long id, String provider, String status, BigDecimal amount, String providerTransactionNo, Instant createdAt, Instant paidAt) { }
    public record VoucherLine(String code, String scope, String discountType, BigDecimal discountAmount, Long supplierOrderId) { }
    public record HistoryLine(String status, String actorEmail, String note, Instant createdAt) { }
    public record OrderDetail(OrderServiceDto.OrderView order, Long customerId, String customerEmail, List<PaymentLine> payments, List<VoucherLine> vouchers, List<HistoryLine> history) { }
    public record DeliveredRequest(@Size(max = 500) String note) { }
    public record AwaitingDelivery(Long id, String orderCode, String status, String paymentMethod, BigDecimal totalAmount, Instant createdAt) { }
    public record BulkDeliveredResult(int confirmed, List<String> orderCodes) { }
    public record CancelRequest(@NotBlank(message = "Vui lòng nhập lý do hủy") @Size(max = 500) String reason) { }
}
