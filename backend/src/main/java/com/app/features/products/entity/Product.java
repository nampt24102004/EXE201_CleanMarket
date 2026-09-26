package com.app.features.products.entity;

import com.app.common.BaseEntity;
import com.app.features.catalog.entity.Category;
import com.app.features.products.enums.ProductApprovalStatus;
import com.app.features.products.enums.ProductStatus;
import com.app.features.suppliers.entity.Supplier;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "products")
@Getter @Setter
public class Product extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "supplier_id", nullable = false) private Supplier supplier;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "category_id", nullable = false) private Category category;
    @Column(nullable = false) private String name;
    @Column(length = 3000) private String description;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal price;
    @Column(nullable = false, length = 30) private String unit;
    @Column(length = 1000) private String imageUrl;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal stock = BigDecimal.ZERO;
    @Column(nullable = false, length = 24) private String approvalStatus = ProductApprovalStatus.DRAFT.name();
    @Column(nullable = false, length = 24) private String status = ProductStatus.INACTIVE.name();
    @Column(length = 120) private String certificateNo;
    @Version private long version;
}
