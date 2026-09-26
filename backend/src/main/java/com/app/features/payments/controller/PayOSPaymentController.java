package com.app.features.payments.controller;

import com.app.common.ApiResponse;
import com.app.features.payments.dto.PayOSPaymentDto.CreateRequest;
import com.app.features.payments.dto.PayOSPaymentDto.CreateResponse;
import com.app.features.payments.dto.PayOSPaymentDto.StatusResponse;
import com.app.features.payments.dto.PayOSPaymentDto.WebhookResponse;
import com.app.features.payments.service.PayOSPaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;

@RestController
@RequestMapping("/api/payments")
public class PayOSPaymentController {
    private final PayOSPaymentService service;
    public PayOSPaymentController(PayOSPaymentService service) { this.service = service; }

    @PostMapping("/payos/create")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<CreateResponse> create(@Valid @RequestBody CreateRequest request) {
        return ApiResponse.ok(service.create(request.orderId()));
    }

    @PostMapping("/payos/webhook")
    public ApiResponse<WebhookResponse> webhook(@RequestBody Webhook webhook) {
        return ApiResponse.ok(service.handleWebhook(webhook));
    }

    @GetMapping("/order/{orderId}/status")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<StatusResponse> status(@PathVariable Long orderId) {
        return ApiResponse.ok(service.status(orderId));
    }
}