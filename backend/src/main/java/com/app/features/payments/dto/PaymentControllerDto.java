package com.app.features.payments.dto;

import jakarta.validation.constraints.NotNull;
import org.springframework.http.*;

public final class PaymentControllerDto {
    private PaymentControllerDto() { }
    public record CreateRequest(@NotNull Long orderId) { }
}
