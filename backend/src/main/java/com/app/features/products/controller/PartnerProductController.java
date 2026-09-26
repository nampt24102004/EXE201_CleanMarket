package com.app.features.products.controller;

import com.app.common.*;
import com.app.features.products.dto.PartnerProductControllerDto.ProductRequest;
import com.app.features.products.dto.PartnerProductControllerDto.ProductView;
import com.app.features.products.service.PartnerProductService;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/partner/products")
public class PartnerProductController {
    private final PartnerProductService service;
    public PartnerProductController(PartnerProductService service) { this.service = service; }
    @GetMapping
    public ApiResponse<List<ProductView>> mine() { return service.mine(); }
    @PostMapping @Transactional
    public ApiResponse<ProductView> create(@Valid @RequestBody ProductRequest request) { return service.create(request); }
    @PutMapping("/{id}") @Transactional
    public ApiResponse<ProductView> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) { return service.update(id, request); }
}
