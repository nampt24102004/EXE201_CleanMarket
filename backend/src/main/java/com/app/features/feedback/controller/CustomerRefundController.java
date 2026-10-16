package com.app.features.feedback.controller;

import com.app.common.ApiResponse;
import com.app.features.feedback.dto.RefundControllerDto.*;
import com.app.features.feedback.service.RefundService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Customer side of refunds: see own refunds and tell CleanMarket where to send the money. */
@RestController @RequestMapping("/api/refunds") @PreAuthorize("hasRole('USER')")
public class CustomerRefundController {
    private final RefundService service;
    public CustomerRefundController(RefundService service) { this.service = service; }
    @GetMapping("/my") public ApiResponse<List<RefundView>> mine() { return service.mine(); }
    @GetMapping("/eligible-orders") public ApiResponse<List<EligibleOrder>> eligibleOrders() { return service.eligibleOrders(); }
    @PutMapping("/{id}/bank-info") public ApiResponse<RefundView> submitBankInfo(@PathVariable Long id, @Valid @RequestBody BankInfoRequest request) { return service.submitBankInfo(id, request); }
}
