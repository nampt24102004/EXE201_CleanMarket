package com.app.features.payments.controller;

import com.app.common.ApiResponse;
import com.app.features.payments.config.PaymentAvailability;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentMethodsController {
    private final PaymentAvailability availability;

    public PaymentMethodsController(PaymentAvailability availability) { this.availability = availability; }

    @GetMapping("/api/payments/methods")
    public ApiResponse<Map<String, Boolean>> methods() {
        return ApiResponse.ok(Map.of("cod", true, "payos", availability.payOS(), "vnpay", availability.vnpay()));
    }
}
