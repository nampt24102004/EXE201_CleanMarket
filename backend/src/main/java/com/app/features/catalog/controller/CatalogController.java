package com.app.features.catalog.controller;

import com.app.common.*;
import com.app.features.catalog.dto.CatalogControllerDto.CategoryView;
import com.app.features.catalog.dto.CatalogControllerDto.ProductView;
import com.app.features.catalog.dto.CatalogControllerDto.SupplierView;
import com.app.features.catalog.service.CatalogService;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api") @Transactional(readOnly = true)
public class CatalogController {
    private final CatalogService service;
    public CatalogController(CatalogService service) { this.service = service; }
    @GetMapping("/categories")
    public ApiResponse<List<CategoryView>> categories() { return service.categories(); }
    @GetMapping("/suppliers")
    public ApiResponse<List<SupplierView>> suppliers() { return service.suppliers(); }
    @GetMapping("/suppliers/{id}")
    public ApiResponse<SupplierView> supplier(@PathVariable Long id) { return service.supplier(id); }
    @GetMapping("/products")
    public ApiResponse<List<ProductView>> products(@RequestParam(required = false) String search, @RequestParam(required = false) Long categoryId, @RequestParam(required = false) Long supplierId, @RequestParam(required = false) BigDecimal maxPrice) { return service.products(search, categoryId, supplierId, maxPrice); }
    @GetMapping("/products/{id}")
    public ApiResponse<ProductView> product(@PathVariable Long id) { return service.product(id); }
}
