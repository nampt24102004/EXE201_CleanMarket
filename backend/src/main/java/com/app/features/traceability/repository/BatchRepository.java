package com.app.features.traceability.repository;

import com.app.features.traceability.entity.ProductBatch;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatchRepository extends JpaRepository<ProductBatch, Long> { Optional<ProductBatch> findByTraceCode(String traceCode); Optional<ProductBatch> findFirstByProductIdAndStatusOrderByCreatedAtDesc(Long productId, String status); List<ProductBatch> findByProductIdOrderByCreatedAtDesc(Long productId); }
