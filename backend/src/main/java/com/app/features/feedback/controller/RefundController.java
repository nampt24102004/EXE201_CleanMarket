package com.app.features.feedback.controller;

import com.app.common.*;
import com.app.features.feedback.dto.RefundControllerDto.CompletionRequest;
import com.app.features.feedback.dto.RefundControllerDto.RefundView;
import com.app.features.feedback.service.RefundService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/manager/refunds")
public class RefundController {
    private final RefundService service;
    public RefundController(RefundService service) { this.service = service; }
    @GetMapping @Transactional(readOnly = true)
    public ApiResponse<List<RefundView>> list() { return service.list(); }
    @PutMapping("/{id}/manual-complete") @Transactional
    public ApiResponse<RefundView> complete(@PathVariable Long id, @Valid @RequestBody CompletionRequest request) { return service.complete(id, request); }
}
