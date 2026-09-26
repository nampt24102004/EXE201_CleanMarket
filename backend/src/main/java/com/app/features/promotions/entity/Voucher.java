package com.app.features.promotions.entity;
import com.app.features.promotions.enums.VoucherDiscountType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import com.app.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "vouchers", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter @Setter
public class Voucher extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String code;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VoucherDiscountType discountType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Column(precision = 15, scale = 2)
    private BigDecimal minimumOrderAmount;

    private Integer usageLimit;

    @Column(nullable = false)
    private int usedCount;

    private Instant startsAt;
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean active = true;
}