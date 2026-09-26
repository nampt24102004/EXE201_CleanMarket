package com.app.features.products.repository;

import com.app.features.products.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    java.util.List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);
}