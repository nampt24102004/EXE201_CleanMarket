package com.app.features.orders.entity;

import com.app.common.BaseEntity;
import com.app.features.auth.entity.UserAccount;
import com.app.features.orders.enums.OrderStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "orders", uniqueConstraints = @UniqueConstraint(columnNames = "orderCode"))
@Getter @Setter
public class MarketOrder extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserAccount user;
    @Column(nullable = false, length = 80) private String orderCode;
    @Column(precision = 15, scale = 2) private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(precision = 15, scale = 2) private BigDecimal discount = BigDecimal.ZERO;
    @Column(precision = 15, scale = 2) private BigDecimal shippingFee = BigDecimal.ZERO;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal totalAmount;
    @Column(nullable = false, length = 24) private String status = OrderStatus.CREATED.name();
    @Column(nullable = false, length = 16) private String paymentMethod;
    @Column(nullable = false) private String fullName;
    @Column(nullable = false, length = 30) private String phone;
    @Column(nullable = false, length = 1000) private String address;
    @Column(length = 1000) private String note;
}
