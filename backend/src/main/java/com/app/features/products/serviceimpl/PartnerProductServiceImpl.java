package com.app.features.products.serviceimpl;

import com.app.common.*;
import com.app.features.audit.service.AuditService;
import com.app.features.auth.security.CurrentUser;
import com.app.features.catalog.entity.Category;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.products.dto.PartnerProductControllerDto.ProductRequest;
import com.app.features.products.dto.PartnerProductControllerDto.ProductView;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.products.service.PartnerProductService;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class PartnerProductServiceImpl implements PartnerProductService {
    private final ProductRepository products; private final SupplierRepository suppliers; private final CategoryRepository categories; private final CurrentUser current; private final AuditService audit;
    public PartnerProductServiceImpl(ProductRepository products, SupplierRepository suppliers, CategoryRepository categories, CurrentUser current, AuditService audit) { this.products = products; this.suppliers = suppliers; this.categories = categories; this.current = current; this.audit = audit; }
    public ApiResponse<List<ProductView>> mine() { Supplier supplier = ownedSupplier(); return ApiResponse.ok(products.findBySupplierId(supplier.getId()).stream().map(this::view).toList()); }
    @Transactional public ApiResponse<ProductView> create(@Valid ProductRequest request) {
        Supplier supplier = ownedSupplier(); if (!"APPROVED".equals(supplier.getStatus())) throw BusinessException.forbidden();
        Product product = new Product(); product.setSupplier(supplier); fill(product, request); product.setApprovalStatus("PENDING_APPROVAL"); product.setStatus("INACTIVE"); products.save(product);
        audit.record(current.get(), "PRODUCT_SUBMIT", "Product", product.getId(), null); return ApiResponse.ok(view(product));
    }
    @Transactional public ApiResponse<ProductView> update(Long id, @Valid ProductRequest request) {
        Product product = ownedProduct(id); if ("APPROVED".equals(product.getApprovalStatus())) throw BusinessException.conflict("PRODUCT_APPROVED", "Không thể sửa sản phẩm đã được duyệt");
        fill(product, request); product.setApprovalStatus("PENDING_APPROVAL"); products.save(product); audit.record(current.get(), "PRODUCT_RESUBMIT", "Product", id, null); return ApiResponse.ok(view(product));
    }
    private void fill(Product product, ProductRequest request) {
        Category category = categories.findById(request.categoryId()).filter(Category::isActive).orElseThrow(() -> BusinessException.missing("Danh mục"));
        product.setCategory(category); product.setName(request.name().trim()); product.setDescription(request.description()); product.setPrice(request.price()); product.setUnit(request.unit().trim()); product.setImageUrl(request.imageUrl()); product.setCertificateNo(request.certificateNo());
    }
    private Supplier ownedSupplier() { return suppliers.findByOwnerId(current.get().getId()).orElseThrow(BusinessException::forbidden); }
    private Product ownedProduct(Long id) { Product p = products.findById(id).orElseThrow(() -> BusinessException.missing("Sản phẩm")); if (!p.getSupplier().getOwner().getId().equals(current.get().getId())) throw BusinessException.forbidden(); return p; }
    private ProductView view(Product p) { return new ProductView(p.getId(), p.getName(), p.getPrice(), p.getUnit(), p.getApprovalStatus(), p.getStatus(), p.getStock()); }
}
