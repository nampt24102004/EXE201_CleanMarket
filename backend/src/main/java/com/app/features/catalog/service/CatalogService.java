package com.app.features.catalog.service;

import com.app.common.*;
import com.app.features.catalog.dto.CatalogControllerDto.CategoryView;
import com.app.features.catalog.dto.CatalogControllerDto.ProductView;
import com.app.features.catalog.dto.CatalogControllerDto.SupplierView;
import java.math.BigDecimal;
import java.util.*;

public interface CatalogService {
    public ApiResponse<List<CategoryView>> categories();
    public ApiResponse<List<SupplierView>> suppliers();
    public ApiResponse<SupplierView> supplier(Long id);
    public ApiResponse<List<ProductView>> products(String search, Long categoryId, Long supplierId, BigDecimal maxPrice);
    public ApiResponse<ProductView> product(Long id);
}
