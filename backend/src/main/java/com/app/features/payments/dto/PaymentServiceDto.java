package com.app.features.payments.dto;

import java.math.BigDecimal;

public final class PaymentServiceDto {
    private PaymentServiceDto() { }
    public record PaymentStatus(String orderCode, String provider, String status, BigDecimal amount) { }
}
