package com.app.features.feedback.controller;

import com.app.common.ApiResponse;
import com.app.features.feedback.dto.RefundControllerDto.*;
import com.app.features.feedback.service.RefundService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/** Staff side of refunds (manager and admin): check the customer's bank account, then record the transfer. */
@RestController @RequestMapping("/api/manager/refunds")
public class RefundController {
    private final RefundService service;
    public RefundController(RefundService service) { this.service = service; }
    @GetMapping public ApiResponse<List<RefundView>> list(@RequestParam(required = false) String status) { return service.list(status); }
    @PutMapping("/{id}/bank-info/approve") public ApiResponse<RefundView> approveBankInfo(@PathVariable Long id) { return service.approveBankInfo(id); }
    @PutMapping("/{id}/bank-info/reject") public ApiResponse<RefundView> rejectBankInfo(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) { return service.rejectBankInfo(id, request); }
    @PutMapping("/{id}/manual-complete") public ApiResponse<RefundView> complete(@PathVariable Long id, @Valid @RequestBody CompletionRequest request) { return service.complete(id, request); }
}
