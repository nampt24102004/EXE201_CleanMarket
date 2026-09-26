package com.app.features.traceability.controller;

import com.app.common.*;
import com.app.features.traceability.dto.TraceControllerDto.BatchRequest;
import com.app.features.traceability.dto.TraceControllerDto.BatchView;
import com.app.features.traceability.dto.TraceControllerDto.TraceView;
import com.app.features.traceability.service.TraceService;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @Transactional(readOnly = true)
public class TraceController {
    private final TraceService service;
    public TraceController(TraceService service) { this.service = service; }
    @PostMapping("/api/partner/products/{productId}/batches") @Transactional
    public ApiResponse<BatchView> create(@PathVariable Long productId, @Valid @RequestBody BatchRequest request) { return service.create(productId, request); }
    @GetMapping("/api/partner/products/{productId}/batches")
    public ApiResponse<List<BatchView>> mine(@PathVariable Long productId) { return service.mine(productId); }
    @GetMapping(value = "/api/partner/batches/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> qr(@PathVariable Long id) throws Exception { return service.qr(id); }
    @GetMapping("/api/trace/{traceCode}")
    public ApiResponse<TraceView> trace(@PathVariable String traceCode) { return service.trace(traceCode); }
}
