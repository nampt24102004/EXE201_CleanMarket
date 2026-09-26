package com.app.features.payments.controller;

import com.app.common.ApiResponse;
import com.app.features.payments.dto.PaymentServiceDto;
import com.app.features.payments.service.PaymentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/orders") @PreAuthorize("hasRole('USER')")
public class PaymentStatusController {
    private final PaymentService service;
    public PaymentStatusController(PaymentService service) { this.service = service; }
    @GetMapping("/{orderCode}/payment-status") public ApiResponse<PaymentServiceDto.PaymentStatus> status(@PathVariable String orderCode) { return ApiResponse.ok(service.status(orderCode)); }
}
