package com.app.features.suppliers.controller;

import com.app.common.*;
import com.app.features.suppliers.dto.SupplierControllerDto.ApplicationRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.DecisionRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.ProfileRequest;
import com.app.features.suppliers.dto.SupplierControllerDto.SupplierView;
import com.app.features.suppliers.service.SupplierService;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @Transactional(readOnly = true)
public class SupplierController {
    private final SupplierService service;
    public SupplierController(SupplierService service) { this.service = service; }
    @PostMapping("/api/suppliers/apply") @Transactional @PreAuthorize("hasRole('USER')")
    public ApiResponse<SupplierView> apply(@Valid @RequestBody ApplicationRequest request) { return service.apply(request); }
    @GetMapping("/api/suppliers/my")
    public ApiResponse<SupplierView> mine() { return service.mine(); }
    @PutMapping("/api/partner/supplier-profile") @Transactional
    public ApiResponse<SupplierView> updateProfile(@Valid @RequestBody ProfileRequest request) { return service.updateProfile(request); }
    @GetMapping("/api/manager/suppliers/pending") @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<List<SupplierView>> pending() { return service.pending(); }
    @PutMapping("/api/manager/suppliers/{id}/approve") @Transactional @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<SupplierView> approve(@PathVariable Long id) { return service.approve(id); }
    @PutMapping("/api/manager/suppliers/{id}/reject") @Transactional @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<SupplierView> reject(@PathVariable Long id, @RequestBody(required = false) DecisionRequest request) { return service.reject(id, request); }
}
