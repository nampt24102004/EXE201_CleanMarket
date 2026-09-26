package com.app.features.products.controller;

import com.app.common.*;
import com.app.features.products.dto.ProductApprovalControllerDto.RejectRequest;
import com.app.features.products.dto.ProductApprovalControllerDto.ReviewView;
import com.app.features.products.service.ProductApprovalService;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/manager/products")
public class ProductApprovalController {
    private final ProductApprovalService service;
    public ProductApprovalController(ProductApprovalService service) { this.service = service; }
    @GetMapping
    public ApiResponse<List<ReviewView>> pending() { return service.pending(); }
    @PutMapping("/{id}/approve") @Transactional
    public ApiResponse<ReviewView> approve(@PathVariable Long id) { return service.approve(id); }
    @PutMapping("/{id}/reject") @Transactional
    public ApiResponse<ReviewView> reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest request) { return service.reject(id, request); }
}
