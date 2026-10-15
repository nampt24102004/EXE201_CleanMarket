package com.app.features.orders.entity;

import com.app.common.BaseEntity;
import com.app.features.orders.enums.SupplierOrderStatus;
import com.app.features.suppliers.entity.Supplier;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "supplier_orders")
@Getter @Setter
public class SupplierOrder extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false) private MarketOrder order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "supplier_id", nullable = false) private Supplier supplier;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal totalAmount;
    @Column(precision = 15, scale = 2) private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(precision = 15, scale = 2) private BigDecimal discount = BigDecimal.ZERO;
    @Column(nullable = false, length = 24) private String status = SupplierOrderStatus.CREATED.name();
}
