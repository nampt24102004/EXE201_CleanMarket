package com.app.features.payments.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class PayOSPaymentDto {
    private PayOSPaymentDto() { }
    public record CreateRequest(@NotNull Long orderId) { }
    public record CreateResponse(Long orderId, String orderCode, Long payOSOrderCode, String paymentStatus,
                                 String checkoutUrl, String qrCode, BigDecimal amount, Instant expiresAt) { }
    public record StatusResponse(Long orderId, String orderCode, String paymentProvider, String paymentStatus,
                                 String orderStatus, BigDecimal amount, Instant paidAt) { }
    public record WebhookResponse(boolean success, String message) { }
}