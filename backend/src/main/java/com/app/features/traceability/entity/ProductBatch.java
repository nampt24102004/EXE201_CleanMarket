package com.app.features.traceability.entity;

import com.app.common.BaseEntity;
import com.app.features.products.entity.Product;
import com.app.features.traceability.enums.BatchStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "product_batches", uniqueConstraints = {@UniqueConstraint(columnNames = "traceCode"), @UniqueConstraint(columnNames = "batchCode")})
@Getter @Setter
public class ProductBatch extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false) private Product product;
    @Column(nullable = false, length = 80) private String batchCode;
    @Column(nullable = false, length = 80) private String traceCode;
    @Column(nullable = false) private String farmName;
    @Column(nullable = false) private String origin;
    @Column(nullable = false) private LocalDate harvestDate;
    @Column(nullable = false) private LocalDate packagingDate;
    private LocalDate expiryDate;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal quantity;
    @Column(length = 120) private String certificateNo;
    @Column(nullable = false, length = 24) private String status = BatchStatus.ACTIVE.name();
}
