package com.app.features.orders.entity;
import com.app.features.traceability.entity.ProductBatch;

import com.app.common.BaseEntity;
import com.app.features.products.entity.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "order_items")
@Getter @Setter
public class OrderItem extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "batch_id") private ProductBatch batch;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "supplier_order_id", nullable = false) private SupplierOrder supplierOrder;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false) private Product product;
    @Column(nullable = false) private String productNameSnapshot;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal unitPrice;
    @Column(nullable = false, length = 30) private String unit;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal quantity;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal totalAmount;
}
