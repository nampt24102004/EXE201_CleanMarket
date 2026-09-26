package com.app.features.payments.controller;

import com.app.common.ApiResponse;
import com.app.features.payments.dto.PaymentControllerDto.CreateRequest;
import com.app.features.payments.dto.PaymentServiceDto;
import com.app.features.payments.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController @RequestMapping("/api/payments/vnpay")
public class PaymentController {
    private final PaymentService service;
    @Value("${app.frontend.base-url}") private String frontendBaseUrl;
    public PaymentController(PaymentService service) { this.service = service; }
    @PostMapping("/create") @PreAuthorize("hasRole('USER')") public ApiResponse<PaymentServiceDto.PaymentUrl> create(@Valid @RequestBody CreateRequest body, HttpServletRequest request) { return ApiResponse.ok(service.create(body.orderId(), request)); }
    @GetMapping("/ipn") public PaymentServiceDto.IpnResult ipn(@RequestParam Map<String, String> params) { return service.ipn(params); }
    @PostMapping("/ipn") public PaymentServiceDto.IpnResult ipnPost(@RequestParam Map<String, String> params) { return service.ipn(params); }
    @GetMapping("/return") public ResponseEntity<Void> callback(@RequestParam Map<String, String> params) {
        String code = service.returnOrderCode(params);
        URI uri = UriComponentsBuilder.fromUriString(frontendBaseUrl).path("/payment-result").queryParamIfPresent("orderCode", java.util.Optional.ofNullable(code)).build().toUri();
        return ResponseEntity.status(HttpStatus.FOUND).location(uri).build();
    }
}
