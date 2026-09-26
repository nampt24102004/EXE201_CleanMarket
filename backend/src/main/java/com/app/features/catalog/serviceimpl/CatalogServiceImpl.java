package com.app.features.catalog.serviceimpl;

import com.app.common.*;
import com.app.features.catalog.dto.CatalogControllerDto.BatchView;
import com.app.features.catalog.dto.CatalogControllerDto.CategoryView;
import com.app.features.catalog.dto.CatalogControllerDto.ProductView;
import com.app.features.catalog.dto.CatalogControllerDto.SupplierView;
import com.app.features.catalog.repository.CategoryRepository;
import com.app.features.catalog.service.CatalogService;
import com.app.features.products.entity.Product;
import com.app.features.products.repository.ProductRepository;
import com.app.features.suppliers.entity.Supplier;
import com.app.features.suppliers.repository.SupplierRepository;
import com.app.features.traceability.entity.ProductBatch;
import com.app.features.traceability.repository.BatchRepository;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly = true)
public class CatalogServiceImpl implements CatalogService {
    private final ProductRepository products; private final SupplierRepository suppliers; private final CategoryRepository categories; private final BatchRepository batches;
    public CatalogServiceImpl(ProductRepository products, SupplierRepository suppliers, CategoryRepository categories, BatchRepository batches) { this.products = products; this.suppliers = suppliers; this.categories = categories; this.batches = batches; }
    public ApiResponse<List<CategoryView>> categories() { return ApiResponse.ok(categories.findByActiveTrueOrderByNameAsc().stream().map(c -> new CategoryView(c.getId(), c.getName())).toList()); }
    public ApiResponse<List<SupplierView>> suppliers() { return ApiResponse.ok(suppliers.findByStatus("APPROVED").stream().map(this::supplier).toList()); }
    public ApiResponse<SupplierView> supplier(Long id) { Supplier s = suppliers.findById(id).filter(item -> "APPROVED".equals(item.getStatus())).orElseThrow(() -> BusinessException.missing("Nhà cung cấp")); return ApiResponse.ok(supplier(s)); }
    public ApiResponse<List<ProductView>> products(String search, Long categoryId, Long supplierId, BigDecimal maxPrice) {
        return ApiResponse.ok(products.findPublic().stream().filter(p -> search == null || p.getName().toLowerCase().contains(search.trim().toLowerCase())).filter(p -> categoryId == null || p.getCategory().getId().equals(categoryId)).filter(p -> supplierId == null || p.getSupplier().getId().equals(supplierId)).filter(p -> maxPrice == null || p.getPrice().compareTo(maxPrice) <= 0).map(this::product).toList());
    }
    public ApiResponse<ProductView> product(Long id) {
        Product p = products.findById(id).filter(item -> "APPROVED".equals(item.getApprovalStatus()) && "ACTIVE".equals(item.getStatus()) && "APPROVED".equals(item.getSupplier().getStatus())).orElseThrow(() -> BusinessException.missing("Sản phẩm"));
        return ApiResponse.ok(product(p));
    }
    private SupplierView supplier(Supplier s) { return new SupplierView(s.getId(), s.getName(), s.getLocation(), s.getDescription(), s.getStatus()); }
    private BatchView batch(ProductBatch b) { return new BatchView(b.getId(), b.getBatchCode(), b.getTraceCode(), b.getFarmName(), b.getOrigin(), b.getHarvestDate(), b.getPackagingDate(), b.getExpiryDate(), b.getCertificateNo(), b.getStatus()); }
    private ProductView product(Product p) {
        BatchView latestBatch = batches.findFirstByProductIdAndStatusOrderByCreatedAtDesc(p.getId(), "ACTIVE").map(this::batch).orElse(null);
        return new ProductView(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getUnit(), p.getImageUrl(), p.getStock(), new CategoryView(p.getCategory().getId(), p.getCategory().getName()), supplier(p.getSupplier()), p.getCertificateNo(), latestBatch);
    }
}