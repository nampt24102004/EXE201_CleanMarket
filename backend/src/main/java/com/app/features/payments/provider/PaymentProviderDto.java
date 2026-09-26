package com.app.features.payments.provider;

import java.time.Instant;

public final class PaymentProviderDto {
    private PaymentProviderDto() { }

    public record CreateResult(Long orderCode, String paymentLinkId, String checkoutUrl, String qrCode,
                               Long amount, String status, Instant expiresAt) { }
    public record StatusResult(Long orderCode, Long amount, Long amountPaid, String status,
                               String paymentLinkId, String transactionId) { }
    public record WebhookResult(Long orderCode, Long amount, String paymentLinkId, String transactionId,
                                String responseCode, String transactionDateTime) { }
}